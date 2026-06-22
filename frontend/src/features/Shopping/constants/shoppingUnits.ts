export type ShoppingUnitOption = {
    value: string;
    singular: string;
    plural: string;
};

export type ShoppingUnitGroup = {
    groupName: string;
    items: ShoppingUnitOption[];
};

export const builtInUnitGroups: ShoppingUnitGroup[] = [
    {
        groupName: "Weights and Volumes",
        items: [
            { value: "gal", singular: "gal", plural: "gal" },
            { value: "oz", singular: "oz", plural: "oz" },
            { value: "lb", singular: "lb", plural: "lb" },
            { value: "kg", singular: "kg", plural: "kg" },
            { value: "g", singular: "g", plural: "g" },
            { value: "pt", singular: "pt", plural: "pt" },
            { value: "qt", singular: "qt", plural: "qt" },
            { value: "liter", singular: "liter", plural: "liters" },
        ],
    },
    {
        groupName: "Amounts",
        items: [
            { value: "dozen", singular: "dozen", plural: "dozen" },
            { value: "pcs", singular: "piece", plural: "pieces" },
        ],
    },
    {
        groupName: "Misc.",
        items: [
            { value: "unit", singular: "unit", plural: "units" },
            { value: "box", singular: "box", plural: "boxes" },
            { value: "bag", singular: "bag", plural: "bags" },
            { value: "carton", singular: "carton", plural: "cartons" },
            { value: "bottle", singular: "bottle", plural: "bottles" },
            { value: "pack", singular: "pack", plural: "packs" },
            { value: "case", singular: "case", plural: "cases" },
            { value: "roll", singular: "roll", plural: "rolls" },
            { value: "tub", singular: "tub", plural: "tubs" },
            { value: "container", singular: "container", plural: "containers" },
            { value: "bundle", singular: "bundle", plural: "bundles" },
        ],
    },
];

export const allBuiltInUnits: ShoppingUnitOption[] = builtInUnitGroups.flatMap(
    (group) => group.items
);

export function getUnitLabel(unitValue: string | null | undefined, quantity: number): string {
    if (!unitValue) return "";

    const match = allBuiltInUnits.find((u) => u.value === unitValue);
    if (!match) return unitValue; // custom unit, no plural form to look up

    return quantity === 1 ? match.singular : match.plural;
}