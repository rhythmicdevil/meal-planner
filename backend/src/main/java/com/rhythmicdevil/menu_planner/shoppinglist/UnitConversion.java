package com.rhythmicdevil.menu_planner.shoppinglist;

import java.math.BigDecimal;
import java.util.Map;

// Groups units that can be summed together (volume, weight) with a common base for conversion.
// Anything not in this table (count-style units like "each"/"clove", or an unrecognized unit
// string) only combines with an exact-matching unit string -- see ShoppingListService.
class UnitConversion {

    enum Kind { VOLUME, WEIGHT }

    record UnitDef(Kind kind, BigDecimal factorToBase) {
    }

    // Volume base unit: milliliter. Weight base unit: gram.
    private static final Map<String, UnitDef> UNIT_DEFS = Map.ofEntries(
            Map.entry("tsp", new UnitDef(Kind.VOLUME, new BigDecimal("4.92892"))),
            Map.entry("teaspoon", new UnitDef(Kind.VOLUME, new BigDecimal("4.92892"))),
            Map.entry("teaspoons", new UnitDef(Kind.VOLUME, new BigDecimal("4.92892"))),
            Map.entry("tbsp", new UnitDef(Kind.VOLUME, new BigDecimal("14.7868"))),
            Map.entry("tablespoon", new UnitDef(Kind.VOLUME, new BigDecimal("14.7868"))),
            Map.entry("tablespoons", new UnitDef(Kind.VOLUME, new BigDecimal("14.7868"))),
            Map.entry("cup", new UnitDef(Kind.VOLUME, new BigDecimal("236.588"))),
            Map.entry("cups", new UnitDef(Kind.VOLUME, new BigDecimal("236.588"))),
            Map.entry("floz", new UnitDef(Kind.VOLUME, new BigDecimal("29.5735"))),
            Map.entry("ml", new UnitDef(Kind.VOLUME, BigDecimal.ONE)),
            Map.entry("milliliter", new UnitDef(Kind.VOLUME, BigDecimal.ONE)),
            Map.entry("milliliters", new UnitDef(Kind.VOLUME, BigDecimal.ONE)),
            Map.entry("l", new UnitDef(Kind.VOLUME, new BigDecimal("1000"))),
            Map.entry("liter", new UnitDef(Kind.VOLUME, new BigDecimal("1000"))),
            Map.entry("liters", new UnitDef(Kind.VOLUME, new BigDecimal("1000"))),
            Map.entry("pint", new UnitDef(Kind.VOLUME, new BigDecimal("473.176"))),
            Map.entry("pints", new UnitDef(Kind.VOLUME, new BigDecimal("473.176"))),
            Map.entry("quart", new UnitDef(Kind.VOLUME, new BigDecimal("946.353"))),
            Map.entry("quarts", new UnitDef(Kind.VOLUME, new BigDecimal("946.353"))),
            Map.entry("gallon", new UnitDef(Kind.VOLUME, new BigDecimal("3785.41"))),
            Map.entry("gallons", new UnitDef(Kind.VOLUME, new BigDecimal("3785.41"))),
            Map.entry("g", new UnitDef(Kind.WEIGHT, BigDecimal.ONE)),
            Map.entry("gram", new UnitDef(Kind.WEIGHT, BigDecimal.ONE)),
            Map.entry("grams", new UnitDef(Kind.WEIGHT, BigDecimal.ONE)),
            Map.entry("kg", new UnitDef(Kind.WEIGHT, new BigDecimal("1000"))),
            Map.entry("kilogram", new UnitDef(Kind.WEIGHT, new BigDecimal("1000"))),
            Map.entry("kilograms", new UnitDef(Kind.WEIGHT, new BigDecimal("1000"))),
            Map.entry("oz", new UnitDef(Kind.WEIGHT, new BigDecimal("28.3495"))),
            Map.entry("ounce", new UnitDef(Kind.WEIGHT, new BigDecimal("28.3495"))),
            Map.entry("ounces", new UnitDef(Kind.WEIGHT, new BigDecimal("28.3495"))),
            Map.entry("lb", new UnitDef(Kind.WEIGHT, new BigDecimal("453.592"))),
            Map.entry("lbs", new UnitDef(Kind.WEIGHT, new BigDecimal("453.592"))),
            Map.entry("pound", new UnitDef(Kind.WEIGHT, new BigDecimal("453.592"))),
            Map.entry("pounds", new UnitDef(Kind.WEIGHT, new BigDecimal("453.592")))
    );

    private UnitConversion() {
    }

    static UnitDef lookup(String unit) {
        if (unit == null) return null;
        return UNIT_DEFS.get(unit.trim().toLowerCase());
    }
}
