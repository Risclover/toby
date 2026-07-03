import { useState } from "react";
import { useCreateShoppingItemUnitMutation, useDeleteShoppingItemUnitMutation, useGetShoppingItemUnitsQuery } from "@/store";
import { builtInUnitGroups } from "../constants/shoppingUnits";
import { KittyNotification } from "@/components";
import { KittyIcons } from "@/assets";

export const useUnitOptions = (
    unit: string,
    onCommit: (u: string) => void,
    onAfterCreate?: () => void
) => {
    const [search, setSearch] = useState('');

    const [createUnit] = useCreateShoppingItemUnitMutation();
    const [deleteUnit] = useDeleteShoppingItemUnitMutation();
    const { data: userUnits } = useGetShoppingItemUnitsQuery();

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

    const handleCreateUnit = async () => {
        try {
            await createUnit({ name: trimmedSearch }).unwrap();
            onCommit(trimmedSearch);
            setSearch('');
            onAfterCreate?.();
            KittyNotification({
                title: "Shopping item unit created successfully",
                message: <>Cool! Unit "<strong style={{ fontWeight: 500 }}>{trimmedSearch}</strong>" is now a thing.</>,
                color: "green",
                icon: KittyIcons.Laptop
            });
        } catch {
            KittyNotification({
                title: "Failed to create shopping item unit",
                message: <>Toby is having a breakdown and failed to create the unit "<strong style={{ fontWeight: 500 }}>{trimmedSearch}</strong>". Try again.</>,
                color: "red",
                icon: KittyIcons.Crying
            });
        }
    };

    const handleDeleteUnit = async (e: React.MouseEvent, id: number, name: string) => {
        e.stopPropagation();
        try {
            await deleteUnit({ id }).unwrap();
            if (unit === name) onCommit("");
            KittyNotification({
                title: "Unit deleted",
                message: <>"<strong style={{ fontWeight: 500 }}>{name}</strong>" has been shot off into space.</>,
                color: "green",
                icon: KittyIcons.Space
            });
        } catch {
            KittyNotification({
                title: "Couldn't delete unit",
                message: <>Something went wrong deleting "<strong style={{ fontWeight: 500 }}>{name}</strong>". Try again.</>,
                color: "red",
                icon: KittyIcons.Evil
            });
        }
    };

    return {
        search,
        setSearch,
        trimmedSearch,
        filteredGroups,
        showCreateOption,
        userUnits,
        handleCreateUnit,
        handleDeleteUnit,
    };
};