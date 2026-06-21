import { Button, Combobox, ScrollArea, useCombobox } from "@mantine/core"
import { useEffect, useState } from "react";
import { LuTag } from "react-icons/lu";

type Props = {
    unit: string;
    quantity: number;
    onCommit: (u: string) => void;
    onClose: (finalValue?: string) => void;
}

export const ShoppingListAddItemUnit = ({ unit, quantity, onCommit, onClose }: Props) => {
    const [search, setSearch] = useState('');

    const combobox = useCombobox({
        onDropdownClose: () => {
            combobox.resetSelectedOption();
            combobox.focusTarget();
            setSearch('');
        },
        onDropdownOpen: () => {
            combobox.focusSearchInput()
        }
    });

    const units = [
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
                { value: "l", singular: "liter", plural: "liters" },
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

    const allUnits = units.flatMap((group) => group.items);
    const trimmedSearch = search.trim();

    const exactMatch = allUnits.some((item) =>
        item.singular.toLowerCase() === trimmedSearch.toLowerCase() ||
        item.plural.toLowerCase() === trimmedSearch.toLowerCase()
    );
    const showCreateOption = trimmedSearch.length > 0 && !exactMatch;

    const filteredGroups = units
        .map((group) => ({
            ...group,
            items: group.items.filter((item) =>
                item.plural.toLowerCase().includes(trimmedSearch.toLowerCase()) ||
                item.singular.toLowerCase().includes(trimmedSearch.toLowerCase())
            ),
        }))
        .filter((group) => group.items.length > 0);

    const options = filteredGroups.map((group) => (
        <Combobox.Group key={group.groupName} label={group.groupName}>
            {group.items.map((item) => (
                <Combobox.Option key={item.value} value={item.value} active={item.value === unit}>
                    {quantity === 1 ? item.singular : item.plural}
                </Combobox.Option>
            ))}
        </Combobox.Group>
    ));

    useEffect(() => {
        combobox.selectFirstOption();
    }, [search]);

    const currentUnitMatch = allUnits.find((i) => i.value === unit);
    const buttonLabel = quantity > 0 && unit
        ? (currentUnitMatch
            ? (quantity === 1 ? currentUnitMatch.singular : currentUnitMatch.plural)
            : unit) // custom unit, display as-typed
        : "Unit";

    return (
        <Combobox
            width="250px"
            store={combobox}
            withinPortal={false}
            onOptionSubmit={(val) => {
                onCommit(val);
                onClose(val);
                combobox.closeDropdown();
            }}
        >
            <Combobox.Target>
                <Button
                    h="auto"
                    p=".25rem .5rem"
                    variant="transparent"
                    size="13px"
                    fw={500}
                    color="var(--mantine-color-gray-7)"
                    className="shopping-list-add-item-detail"
                    onClick={() => combobox.toggleDropdown()}
                    disabled={quantity === 0}
                >
                    <span className="add-item-detail-icon">
                        <LuTag />
                    </span>
                    {buttonLabel}
                </Button>
            </Combobox.Target>
            <Combobox.Dropdown>
                <Combobox.Search
                    value={search}
                    onChange={(event) => setSearch(event.currentTarget.value)}
                    placeholder="Type in unit"
                />
                <Combobox.Options>
                    <ScrollArea.Autosize type="scroll" mah={300}>
                        {options}
                        {showCreateOption && (
                            <Combobox.Option value={trimmedSearch} key="__custom__">
                                Use "{trimmedSearch}"
                            </Combobox.Option>
                        )}
                        {options.length === 0 && !showCreateOption && (
                            <Combobox.Empty>No matches</Combobox.Empty>
                        )}
                    </ScrollArea.Autosize>
                </Combobox.Options>
            </Combobox.Dropdown>
        </Combobox>
    )
}