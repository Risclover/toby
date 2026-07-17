import { useRef, useState } from "react";
import { useCombobox } from "@mantine/core";
import { KittyNotification } from "@/components";
import { builtInUnitGroups, getUnitLabel } from "../constants/shoppingUnits";
import { useCreateShoppingItemUnitMutation, useDeleteShoppingItemUnitMutation, useGetShoppingItemUnitsQuery } from "@/store";
import { KittyIcons } from "@/assets";

type Params = {
    unit: string;
    quantity: number;
    onCommit: (u: string) => void;
    onClose: (finalValue?: string) => void;
}

export const useShoppingListAddItemUnit = ({ unit, quantity, onCommit, onClose }: Params) => {
    const [search, setSearch] = useState('');
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    const [createUnit] = useCreateShoppingItemUnitMutation();
    const [deleteUnit] = useDeleteShoppingItemUnitMutation();
    const { data: userUnits } = useGetShoppingItemUnitsQuery();

    const combobox = useCombobox({
        onDropdownClose: () => {
            combobox.resetSelectedOption();
            combobox.focusTarget();
            setSearch('');
        },
        onDropdownOpen: () => {
            combobox.focusSearchInput();
            requestAnimationFrame(() => {
                scrollAreaRef.current?.scrollTo({ top: 0 });
            });
        }
    });

    // Building the dropdown groups and options

    const customGroup = userUnits && userUnits.length > 0
        ? {
            groupName: "Custom",
            items: [...userUnits]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((u) => ({ value: u.name, singular: u.name, plural: u.name })),
        }
        : null;

    const allGroups = customGroup ? [...builtInUnitGroups, customGroup] : builtInUnitGroups;

    const allUnits = allGroups.flatMap((group) => group.items);
    const trimmedSearch = search.trim();

    // Case-insensitive exact match check to determine whether to show the "Create unit" option
    const exactMatch = allUnits.some((item) =>
        item.singular.toLowerCase() === trimmedSearch.toLowerCase() ||
        item.plural.toLowerCase() === trimmedSearch.toLowerCase()
    );
    const showCreateOption = trimmedSearch.length > 0 && !exactMatch;

    const filteredGroups = allGroups
        .map((group) => ({
            ...group,
            items: group.items.filter((item) =>
                item.plural.toLowerCase().includes(trimmedSearch.toLowerCase()) ||
                item.singular.toLowerCase().includes(trimmedSearch.toLowerCase())
            ),
        }))
        .filter((group) => group.items.length > 0);

    // Unit button label (handles pluralization and empty state, including quantity empty state)
    const buttonLabel = quantity > 0 && unit.length > 0 ? getUnitLabel(unit, quantity) : "Unit";

    const handleOptionSubmit = (val: string) => {
        const newValue = val === unit ? "" : val;
        onCommit(newValue);
        onClose(newValue);
        combobox.closeDropdown();
    };

    const handleClearUnit = () => {
        onCommit("");
        onClose("");
        combobox.closeDropdown();
    };

    const handleCreateUnit = async (trimmedValue: string) => {
        try {
            await createUnit({ name: trimmedValue }).unwrap();
            onCommit(trimmedValue);
            onClose(trimmedValue);
            combobox.closeDropdown();
            KittyNotification({
                title: "Shopping item unit created successfully",
                message: <>Cool! Unit "<strong style={{ fontWeight: 500 }}>{trimmedValue}</strong>" is now a thing.</>,
                color: "green",
                icon: KittyIcons.Laptop
            })
        } catch (error) {
            console.error("Error creating unit:", error);
            KittyNotification({
                title: "Failed to create shopping item unit",
                message: <>Toby is having a breakdown and failed to create the unit "<strong style={{ fontWeight: 500 }}>{trimmedValue}</strong>". Try again.</>,
                color: "red",
                icon: KittyIcons.Crying
            })
        }
    };

    const handleDeleteUnit = async (e: React.MouseEvent, id: number, name: string) => {
        e.stopPropagation();
        try {
            await deleteUnit({ id }).unwrap();
            if (unit === name) {
                onCommit("");
                onClose("");
            }
            KittyNotification({
                title: "Unit deleted",
                message: <>"<strong style={{ fontWeight: 500 }}>{name}</strong>" has been shot off into space.</>,
                color: "green",
                icon: KittyIcons.Space
            })
        } catch (error) {
            console.error("Error deleting unit:", error);
            KittyNotification({
                title: "Couldn't delete unit",
                message: <>Something went wrong deleting "<strong style={{ fontWeight: 500 }}>{name}</strong>". Try again.</>,
                color: "red",
                icon: KittyIcons.Thinking
            })
        }
    };

    return {
        // combobox
        combobox,
        scrollAreaRef,
        // search
        search,
        setSearch,
        trimmedSearch,
        // data
        userUnits,
        filteredGroups,
        showCreateOption,
        buttonLabel,
        // handlers
        handleOptionSubmit,
        handleClearUnit,
        handleCreateUnit,
        handleDeleteUnit,
    };
};
