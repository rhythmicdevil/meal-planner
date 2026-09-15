# Recipe & Grocery List App — Planning Document

## 1. Purpose of this document
This is a design/planning doc meant to be handed to Claude Code as the starting brief for building the application. It covers the domain model, core workflows, the import module, tech stack recommendations, deployment approach, and a suggested phased build order. Treat the "Open Decisions" section at the end as things to confirm/adjust before or during implementation.

---

## 2. Domain Model

### Core entities

**Ingredient** (master catalog — the canonical, de-duplicated ingredient list)
- `id`
- `name` (canonical, e.g. "yellow onion")
- `aliases[]` (e.g. "onion", "yellow onions", "spanish onion") — used for fuzzy import matching
- `defaultUnit` (optional, e.g. "each", "g") — used when a recipe doesn't specify, or for conversion baseline
- `category` (produce, dairy, pantry, protein, spice, etc.) — useful later for organizing the shopping list by grocery aisle

**RecipeIngredient** (join entity — a line item within a recipe)
- `id`
- `recipeId`
- `ingredientId`
- `amount` (numeric quantity, optional — null for a "to taste" ingredient with no fixed quantity)
- `unit` (cup, tbsp, g, oz, each, etc., optional for the same reason)
- `cutType` (chopped, diced, minced, julienned, sliced, shredded, grated, whole, etc.) — the physical cut/prep applied to the ingredient
- `stateCondition` (raw, cooked, frozen, thawed, softened, melted, room temp, etc.) — the state/condition of the ingredient
- `notes` (optional, e.g. "divided", "or to taste")

> Note on `cutType`/`stateCondition`: originally modeled as one combined "prep style" field, but split into two because they answer different questions and are used differently downstream. Both should be controlled vocabularies/enums with an "other/freeform" escape hatch, rather than pure free text.
> - `stateCondition` is what the **Shopping List** logic cares about: it's the field that determines whether an ingredient is "raw/unprepped" (combinable across recipes) vs. "prepped" (not blindly combinable) — see §3.2.
> - `cutType` and `stateCondition` together are what the **Prep List** cares about, since it needs to tell the cook both what to do to an ingredient and in what state it should end up — see §3.3.

**Recipe**
- `id`
- `name`
- `sourceUrl` (for imported recipes)
- `servings`
- `instructions[]` (ordered `RecipeStep`: `stepNumber`, `text`)
- `ingredients[]` (RecipeIngredient, above)
- `tags[]` (cuisine, meal type, etc. — optional but cheap to add now)

**Menu**
- `id`, `name`
- `recipes[]` (1..N Recipe references) — essentially a curated, reusable collection of recipes (e.g. "Weeknight Favorites")

**MealPlan**
- `id`, `name`, `dateRange` (optional, e.g. week of 9/14)
- `items[]` — each item is **either** a direct Recipe reference **or** a Menu reference (1..N total). This covers the one-pot-meal case: a single Recipe can be added on its own without needing to wrap it in a Menu first, while a Menu (e.g. "Taco Night" = tacos + rice + salsa) can still be added as one unit when you want a themed set of dishes to travel together.
  - Modeling note: implement this as a `MealPlanItem` join entity with a discriminator (`itemType`: RECIPE or MENU) and the corresponding `recipeId` or `menuId` set — not two separate nullable FK columns crammed onto MealPlan itself. The Recipe reference is live (no version pinning — see Open Decision #4), so a MealPlan always reflects the current state of its recipes.
  - Wherever downstream logic (Shopping List, Prep List) needs "all recipes in this Meal Plan," resolve `items[]` by expanding any Menu items into their constituent recipes first, then treat the result as one flat recipe list.

**ShoppingList** (generated from a MealPlan)
- `id`, `mealPlanId`
- `items[]` (ShoppingListItem)

**ShoppingListItem**
- `ingredientId`
- `totalAmount`, `unit`
- `sourceRecipeIds[]` (for traceability — "this qty came from these recipes")
- Only includes ingredients used in a **raw/unprepped** state; matching raw ingredients across recipes are summed into a single line (see §3.2 on the merge/conversion logic).

**PrepList** (generated from a MealPlan)
- `id`, `mealPlanId`
- `items[]` (PrepListItem: ingredientId, amount, unit, cutType, stateCondition, sourceRecipeIds[])
- Lists ingredients **with** their cut type and state condition, generally *not* combined across recipes unless amount + unit + cutType + stateCondition all match exactly (this is a reasonable default — see Open Decisions).

**ImportSource / ImportJob** (see §4)

### Relationships summary
```
Ingredient 1---* RecipeIngredient *---1 Recipe
Recipe *---* Menu             (via join table)
MealPlan 1---* MealPlanItem   (each item is EITHER a Recipe OR a Menu reference)
MealPlan 1---1 ShoppingList
MealPlan 1---1 PrepList
```

---

## 3. Core Workflows

### 3.1 Build a Menu / Meal Plan
Straightforward CRUD: select recipes from the catalog to build a Menu. A MealPlan is built by adding items that are each either a standalone Recipe (e.g. a one-pot meal that doesn't need a Menu wrapper) or a whole Menu (e.g. "Taco Night," pulling in all of its recipes at once).

### 3.2 Generate a Shopping List
1. Collect all `RecipeIngredient` rows across every recipe in the MealPlan.
2. Filter to only those where `stateCondition` = raw/unprepped (or null).
3. Group by `ingredientId` (resolved to the canonical Ingredient, not just by matching text — this is why the Ingredient catalog with aliases matters).
4. Within a group, normalize units before summing (e.g. tbsp → cup, g → kg) using a conversion table. If units are fundamentally incompatible for that ingredient (e.g. "2 each onions" + "200g onions"), you can't just sum them — either:
   - keep both as separate lines under the same ingredient ("2 onions" + "200g onions"), or
   - maintain a per-ingredient weight/volume/each conversion (e.g. "1 medium onion ≈ 150g") to fully unify.
   Start simple (rule A: separate lines when units are incompatible in kind), and add ingredient-specific conversion data later if it's worth the effort.
5. Round the final summed amount up to the nearest purchasable/whole unit before display (e.g. 1.5 onions needed → shows "2 onions"; this favors slight overbuying over asking the user to buy a fractional item, which matches how grocery shopping actually works).
6. Emit one `ShoppingListItem` per ingredient (or per ingredient+unit-kind if not fully unified).
7. `RecipeIngredient.amount`/`unit` can be null ("to taste" items, e.g. salt/pepper). These can't be summed with a quantity — emit them as a flagged line with no amount (e.g. "salt — to taste") rather than folding them into the rounding/unification logic above.

### 3.3 Generate a Prep List
1. Collect `RecipeIngredient` rows across every recipe in the MealPlan, but only those that actually need prep work done to them (i.e. have a non-trivial `cutType`) — for now, scope this to **vegetables** specifically (an ingredient's `category` = produce/vegetable), since that's the current focus; other categories (proteins, pantry items, etc.) can be brought into Prep List scope later without changing the underlying model.
2. Group by (ingredientId, stateCondition, **cutType group**) rather than exact `cutType` — similar cut types (e.g. "diced" and "chopped") combine into one line, while genuinely different prep (e.g. "diced" vs. "sliced into rounds") stays separate. This means `cutType` needs a notion of grouping/equivalence built into its enum (e.g. a small lookup table mapping specific cut types to a broader "similarity group"), not just a flat list of values.
3. Sum amounts within an identical (ingredientId, unit, stateCondition, cutType group) group.

---

## 4. Import Module

### Goals
- Import recipes by URL: given a recipe page URL, fetch the page server-side and extract the embedded recipe data. This is the Phase 4 entry point — no manual file download/upload step required.
- Architect it so a browser extension could later POST pre-extracted recipe data (JSON-LD/microdata already pulled from the page) directly to the same backend pipeline, skipping the server-side fetch — useful for JS-rendered or login-gated pages the URL adapter can't reach on its own.
- Handle fuzzy matching (imported ingredient text → canonical Ingredient catalog entries) and unit/format normalization.

### Suggested architecture
Treat import as a **pipeline with pluggable front-end parsers feeding a common intermediate format**, not one monolithic importer:

```
[Source] -> [Parser/Adapter] -> [RawRecipeDTO] -> [Normalization/Matching] -> [Recipe entity] -> [Review/Confirm] -> [Save]
```

- **RawRecipeDTO**: a loose intermediate schema (title, servings, raw ingredient lines as strings, raw instruction lines as strings, source metadata). This is the contract every parser produces, regardless of source.
- **Parser/Adapter interface**: `RecipeImportAdapter` with one method roughly like `RawRecipeDTO parse(InputSource source)`. Implementations:
  - `UrlImportAdapter` (Phase 4, primary path) — given a recipe URL, fetch the page over HTTP, then extract the embedded [schema.org/Recipe](https://schema.org/Recipe) JSON-LD (or microdata fallback) from the HTML. Implementation note: write the fetched HTML to a temp directory before parsing rather than parsing the HTTP response in-memory directly — makes failed extractions easy to debug (you can inspect exactly what was fetched) and doubles as a natural source for test fixtures (see Open Decision #6).
  - Later: `WebScrapeImportAdapter` — same interface, fed by a browser extension that extracts the page's JSON-LD/microdata client-side and POSTs it to a new REST endpoint (e.g. `POST /api/import/raw`), which runs it through the same normalization pipeline. This is the payoff of designing to the interface now, and it's the fallback for pages the server-side fetch can't handle.
  - This is a good fit for a **Strategy pattern** in Spring: register each adapter as a bean, pick the right one based on import request type/content-type.
- **Normalization/Matching stage**: takes the raw ingredient line strings (e.g. `"2 cups yellow onion, diced"`) and:
  1. Parses out amount, unit, ingredient name, cut type, and state condition — this is the hardest NLP-ish part. A rule-based parser (regex + a units dictionary + cut-type/state-condition keyword lists) will get you 80-90% of the way for typical recipe text; consider a library rather than hand-rolling from scratch (see §5).
  2. Fuzzy-matches the extracted ingredient name against existing `Ingredient.name`/`aliases` (e.g. using Levenshtein distance / trigram similarity — Postgres has `pg_trgm` built in for this, which is a strong argument for Postgres as your DB, see §6).
  3. If confidence is high, auto-link to the existing Ingredient. If low/no match, either create a new Ingredient or flag for manual review.
- **Review/Confirm step**: since fuzzy matching will never be 100%, plan on an import review UI where the user sees the parsed recipe and can correct ingredient matches, amounts, units, and prep styles before final save. Don't try to make import fully automatic on day one.

### Note on recipe sources
Since real-world recipes you'll be pulling from tend to come from sites like Blue Apron's cookbook, AllRecipes, and Budget Bytes, it's worth gathering a handful of real URLs from each of those (and saving the fetched HTML into test fixtures — see Open Decision #6) so the parser is tested against real variety in ingredient-line phrasing and JSON-LD structure, not just one clean format.

---

## 5. Suggested Technology Stack

### Backend
- **Spring Boot 3.x**, Java 21 LTS
- **Spring Web** for REST controllers
- **Spring Data JPA** for persistence
- **Spring Validation** for request validation
- **Spring Security** with HTTP Basic auth (per Open Decision #5) — lightweight enough for a personal/home-network app while still gating access if the household ends up multi-user.
- Consider **springdoc-openapi** for auto-generated OpenAPI/Swagger docs — handy both for your own frontend dev and for eventually documenting the import endpoint for a future browser extension.
- For ingredient-line parsing, look at existing recipe-ingredient-parsing libraries (several open-source ones exist in Python/JS — e.g. `ingreedient`-style parsers) even if you have to port/reimplement the logic in Java; no need to design the grammar from scratch.
- For fuzzy string matching in Java: Apache Commons Text (Levenshtein, Jaro-Winkler) is a solid lightweight option if you want matching logic in the app layer rather than pushed into SQL.

### Database
- **MySQL** — chosen over Postgres since you already know it well; no reason to take on a new database system for a personal project.
  - One trade-off to be aware of: Postgres has `pg_trgm` built in for trigram-based fuzzy text matching, which MySQL doesn't have a direct equivalent for. This isn't a blocker — do the ingredient fuzzy-matching in the **application layer** instead (e.g. Apache Commons Text's Levenshtein/Jaro-Winkler, mentioned below), rather than pushing it into SQL. MySQL's built-in full-text search (`MATCH ... AGAINST`) can still help narrow candidates before the Java-side scoring runs.
  - JSON column support is fine in modern MySQL (5.7+/8.x) if you want to keep the original raw import payload alongside the parsed/normalized recipe.
- Use **Flyway** or **Liquibase** for schema migrations from day one — much easier than retrofitting once you have real data. Both work fine with MySQL.

### Frontend
**Decided: React + Vite + TypeScript**, paired with a component library like **Mantine** or **shadcn/ui** + Tailwind CSS to avoid hand-rolling UI polish. It calls the Spring Boot REST API, keeping frontend and backend cleanly separated (which you want anyway since a browser extension will also be a REST client later). It's also the most common frontend choice today, with the most available tooling/examples/help.

### Containerization
- Multi-container **Docker Compose** stack: `backend` (Spring Boot), `frontend` (built static assets served via Nginx, or served by Spring Boot itself if you skip a separate frontend server), `db` (Postgres), with a named volume for Postgres data.
- Since you already run a Docker-based home server (the Lenovo M920Q, currently running Navidrome/Audiobookshelf/Jellyfin/Pi-hole), this app can slot in the same way — its own Compose file, its own dedicated service account rather than running as root, and reachable over your Tailscale network the same way your other services are, rather than opening it up externally.

---

## 6. Deployment (Phase 1)
- Local network only, no external exposure needed.
- Docker Compose on your existing media server (M920Q) alongside your other containers, or a separate host if you'd rather isolate it — either works, but reusing the M920Q avoids new hardware for what's initially a low-traffic personal app.
- Reasonable to expose it on your Tailscale network for remote access the same way your other self-hosted services are, rather than port-forwarding.

---

## 7. Suggested Build Phases (for Claude Code)

**Phase 1 — Core domain + CRUD**
- Spring Boot project scaffold, MySQL + Flyway setup
- Entities/tables: Ingredient, Recipe, RecipeIngredient, Menu, MealPlan (join table for Menu↔Recipe; MealPlanItem join table with RECIPE/MENU discriminator for MealPlan)
- REST CRUD endpoints for Ingredient and Recipe (manual entry, no import yet)
- Basic frontend: recipe list/detail/create/edit forms

**Phase 2 — Menu & Meal Plan builder**
- Endpoints + UI to assemble Menus and Meal Plans from the recipe catalog

**Phase 3 — Shopping List & Prep List generation**
- Implement the merge/grouping logic from §3.2 and §3.3
- Endpoints + UI to view/generate these from a MealPlan

**Phase 4 — Import module (URL-based)**
- Define `RawRecipeDTO` and `RecipeImportAdapter` interface
- Implement `UrlImportAdapter`: given a recipe URL, fetch the page (downloading the HTML to a temp directory), extract schema.org/JSON-LD recipe markup, and produce a `RawRecipeDTO`
- Implement ingredient parsing (amount/unit/prep-style extraction) + fuzzy matching against the Ingredient catalog
- Build the review/confirm UI for imports

**Phase 5 — Polish / later**
- Tags, categories, aisle-based shopping list ordering
- Ingredient-specific unit conversion table (e.g. "1 onion ≈ 150g") for fuller shopping-list merging
- Browser extension + `POST /api/import/raw` endpoint reusing the same normalization pipeline as Phase 4

---

## 8. Open Decisions to confirm before/while building
1. ~~**Cut type / state condition vocabularies**~~ — **Decided:** closed enum for both `cutType` and `stateCondition`, each with an "other" freeform escape hatch.
2. ~~**Shopping list merge across incompatible units**~~ — **Decided:** round up to the nearest purchasable whole unit rather than chasing precision; slight overbuying (e.g. buying 2 onions when a recipe needs 1.5) is fine.
3. ~~**Prep List merge granularity**~~ — **Decided:** group similar cut types together (e.g. "diced" and "chopped" combine), rather than requiring an exact match.
4. ~~**Recipe versioning**~~ — **Decided:** no. Originally planned (a `version` counter + `MealPlanItem` pinning to the version active at add-time), but walked back — recipes won't be edited often enough for stale-plan drift to matter in practice. A `MealPlanItem` now just references the live Recipe; editing a Recipe immediately updates anywhere it's referenced from a MealPlan/Menu.
5. ~~**Auth**~~ — **Decided:** basic auth for now.
6. ~~**Import source**~~ — **Decided:** Phase 4 imports by URL (`UrlImportAdapter` fetches the page server-side, downloading HTML to a temp directory before parsing) rather than requiring a manually downloaded file; browser-extension POST of pre-extracted data remains a Phase 5 fallback for pages the server can't fetch directly.
7. **Sample recipe URLs / test fixtures**: needed to finalize the Phase 4 parser design against real JSON-LD variety. You'll supply a handful of real recipe URLs (e.g. from Blue Apron, AllRecipes, Budget Bytes) once implementation gets underway, and the fetched HTML can be saved into a test fixtures directory for repeatable parsing tests — **note for Claude Code: hold off finalizing the Phase 4 parser/adapter details until those sample URLs are provided and reviewed.**
