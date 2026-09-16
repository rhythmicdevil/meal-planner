import type { IngredientCategory } from '../api/types'

// Best-effort keyword lookup for auto-created ingredients (bulk-paste has no other signal
// for category). Same spirit as parseIngredientLine.ts: a lightweight heuristic meant to
// save re-categorizing everything by hand, not a rigorous classifier -- expect to correct
// the occasional miss. Rules are checked in order, most-specific phrases first, so e.g.
// "bell pepper" (produce) is caught before the bare "pepper" (spice) rule below it.
const RULES: { pattern: RegExp; category: IngredientCategory }[] = [
  // specific multi-word phrases that would otherwise be caught by a more generic rule below
  { pattern: /\bbell pepper/, category: 'PRODUCE' },
  { pattern: /\bgreen onion|\bscallion/, category: 'PRODUCE' },
  { pattern: /\bolive oil|\bvegetable oil|\bcanola oil|\bsesame oil|\bavocado oil/, category: 'CONDIMENTS_AND_DRESSINGS' },
  { pattern: /\brice vinegar|\bbalsamic vinegar|\bcider vinegar|\bwine vinegar/, category: 'CONDIMENTS_AND_DRESSINGS' },
  { pattern: /\bvegetable (stock|broth)|\bchicken (stock|broth)|\bbeef (stock|broth)/, category: 'CANNED_GOODS_AND_SOUP' },
  { pattern: /\bbrussels sprout/, category: 'PRODUCE' },
  { pattern: /\bice cream/, category: 'FROZEN_FOODS' },
  // "juice"/"wine"/"beer" etc. are strong enough signals to override whatever fruit or
  // grain name precedes them (e.g. "orange juice" is a beverage, not produce)
  { pattern: /\bjuice\b|\bwine\b|\bbeer\b|\bsoda\b/, category: 'BEVERAGES' },

  // produce: vegetables, fruits, fresh herbs
  {
    pattern:
      /\btomato|\bonion|\bgarlic|\bcarrot|\bcelery|\bpotato|\blettuce|\bspinach|\bkale|\bbroccoli|\bcauliflower|\bzucchini|\bsquash|\bcucumber|\bmushroom|\bavocado|\bapple|\bbanana|\blemon|\blime|\borange|\bberr|\bgrape|\bmelon|\bpear|\bpeach|\bplum|\bcabbage|\bcorn\b/,
    category: 'PRODUCE',
  },
  { pattern: /\bcilantro|\bbasil|\bparsley|\bmint\b|\bthyme|\brosemary|\bsage\b|\bdill\b|\bchive/, category: 'PRODUCE' },
  { pattern: /\bpepper\b/, category: 'BAKING_AND_SPICES' },

  // dairy (eggs included -- shelved in the dairy case at most grocery stores)
  { pattern: /\bcheese|\bmilk\b|\bbutter|\byogurt|\bcream\b|\begg\b|\beggs\b/, category: 'DAIRY' },

  // meat & seafood
  { pattern: /\bchicken|\bbeef|\bpork|\bturkey|\bbacon|\bsausage|\bfish\b|\bshrimp|\bsalmon|\btuna|\blamb/, category: 'MEAT_AND_SEAFOOD' },

  // grains: pasta, rice, and other staple grains all land in the same bucket since
  // there's no dedicated "grains" category
  { pattern: /\brice\b|\bpasta|\bnoodle|\bspaghetti|\bmacaroni|\bquinoa|\bcouscous|\boats\b|\boatmeal|\bfreekeh|\bfarro|\bbarley|\bbulgur/, category: 'PASTA_RICE_AND_SAUCES' },

  // baking & spices
  { pattern: /\bflour|\bsugar|\bsalt\b|\byeast|\bbaking soda|\bbaking powder|\bvanilla|\bcinnamon|\bcumin|\bpaprika|\bnutmeg|\boregano|\bchili powder|\bcocoa|\bginger/, category: 'BAKING_AND_SPICES' },

  // condiments & dressings
  { pattern: /\bvinegar|\boil\b|\bketchup|\bmustard|\bmayo|\bsoy sauce|\bhot sauce|\bdressing|\bhoney/, category: 'CONDIMENTS_AND_DRESSINGS' },

  // canned goods & soup
  { pattern: /\bstock\b|\bbroth\b|\bcanned|\bsoup\b|\bbeans\b/, category: 'CANNED_GOODS_AND_SOUP' },

  // beverages (wine/beer/juice/soda are already caught earlier, before produce/grain rules)
  { pattern: /\bcoffee\b|\btea\b/, category: 'BEVERAGES' },

  // frozen
  { pattern: /\bfrozen\b/, category: 'FROZEN_FOODS' },

  // bakery
  { pattern: /\bbread\b|\bbagel\b|\btortilla\b|\bpita\b|\bbun\b|\broll\b/, category: 'BAKERY' },
]

export function guessIngredientCategory(name: string): IngredientCategory {
  const normalized = name.toLowerCase()
  for (const rule of RULES) {
    if (rule.pattern.test(normalized)) {
      return rule.category
    }
  }
  return 'OTHER'
}
