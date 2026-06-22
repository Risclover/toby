import { ActionIcon, CloseIcon, Button, Combobox, ScrollArea, Text, Tooltip, useCombobox } from "@mantine/core"
import { useRef, useState } from "react";
import { LuTag } from "react-icons/lu";
import { HiPlus } from "react-icons/hi";
import { useCreateShoppingItemUnitMutation, useDeleteShoppingItemUnitMutation, useGetShoppingItemUnitsQuery } from "@/store";
import { KittyNotification } from "@/components";
import { KittyIcons } from "@/assets";
import { FaTrash } from "react-icons/fa";
import { FaCheck } from "react-icons/fa6";
import { builtInUnitGroups, getUnitLabel } from "../../constants/shoppingUnits";

type Props = {
    unit: string;
    quantity: number;
    onCommit: (u: string) => void;
    onClose: (finalValue?: string) => void;
}

export const ShoppingListAddItemUnit = ({ unit, quantity, onCommit, onClose }: Props) => {
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

    const options = filteredGroups.map((group) => (
        <Combobox.Group key={group.groupName} label={group.groupName}>
            {group.items.map((item) => {
                const isCustom = group.groupName === "Custom";
                const customUnitId = isCustom
                    ? userUnits?.find((u) => u.name === item.value)?.id
                    : undefined;

                return (
                    <Combobox.Option key={item.value} value={item.value} active={item.value === unit} style={item.value === unit ? { backgroundColor: "var(--mantine-color-gray-0)" } : undefined}
                    >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                            <span>{quantity === 1 ? item.singular : item.plural}</span>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                {isCustom && customUnitId !== undefined && (
                                    <ActionIcon
                                        variant="transparent"
                                        size="xs"
                                    >
                                        <FaTrash
                                            size=".75rem"
                                            color="var(--mantine-color-gray-4)"
                                            onClick={(e) => handleDeleteUnit(e, customUnitId, item.value)}
                                            style={{ cursor: "pointer", flexShrink: 0 }}
                                        />
                                    </ActionIcon>
                                )}
                                {item.value === unit && <FaCheck color="var(--mantine-color-gray-6)" size="1rem" />}
                            </div>
                        </div>
                    </Combobox.Option>
                );
            })}
        </Combobox.Group>
    ));

    // Unit button label (handles pluralization and empty state, including quantity empty state)
    const buttonLabel = quantity > 0 && unit.length > 0 ? getUnitLabel(unit, quantity) : "Unit";

    const handleCreateUnit = async (trimmedSearch: string) => {
        try {
            await createUnit({ name: trimmedSearch }).unwrap();
            onCommit(trimmedSearch);
            onClose(trimmedSearch);
            combobox.closeDropdown();
            KittyNotification({
                title: "Shopping item unit created successfully",
                message: <>Cool! Unit "<strong style={{ fontWeight: 500 }}>{trimmedSearch}</strong>" is now a thing.</>,
                color: "green",
                icon: KittyIcons.Computer
            })
        } catch (error) {
            console.error("Error creating unit:", error);
            KittyNotification({
                title: "Failed to create shopping item unit",
                message: <>Toby is having a breakdown and failed to create the unit "<strong style={{ fontWeight: 500 }}>{trimmedSearch}</strong>". Try again.</>,
                color: "red",
                icon: KittyIcons.Cry
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
                icon: KittyIcons.Astronaut
            })
        } catch (error) {
            console.error("Error deleting unit:", error);
            KittyNotification({
                title: "Couldn't delete unit",
                message: <>Something went wrong deleting "<strong style={{ fontWeight: 500 }}>{name}</strong>". Try again.</>,
                color: "red",
                icon: KittyIcons.Ghost
            })
        }
    };

    return (
        <Combobox
            width="250px"
            store={combobox}
            withinPortal={false}
            onOptionSubmit={(val) => {
                const newValue = val === unit ? "" : val;
                onCommit(newValue);
                onClose(newValue);
                combobox.closeDropdown();
            }}
            styles={{
                option: {
                    fontSize: "var(--text-sm) !important"
                },
                footer: {
                    padding: 0,
                },
                search: {
                    marginBottom: 0,
                    marginInline: 0,
                    marginLeft: "-2px"
                },
            }}
            shadow="sm"
        >
            <Combobox.Target>
                <Tooltip label="Select quantity" position="top" disabled={quantity !== 0}>
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
                        <Text c="black" size="13px" truncate="end">
                            {buttonLabel}
                        </Text>
                        {unit.length > 0 && quantity !== 0 && <ActionIcon h="auto" p={0} variant="transparent" size="compact-xs" onClick={(e) => {
                            e.stopPropagation();
                            onCommit("");
                            onClose("");
                            combobox.closeDropdown();
                        }}
                            ml=".25rem"
                            style={{ flexShrink: 0 }}
                        >
                            <CloseIcon size=".9rem" color="var(--mantine-color-gray-6)" />
                        </ActionIcon>}
                    </Button>
                </Tooltip>
            </Combobox.Target>
            <Combobox.Dropdown>
                <Combobox.Search
                    value={search}
                    onChange={(event) => setSearch(event.currentTarget.value)}
                    placeholder="Type in unit"
                    maxLength={15}
                />
                <Combobox.Options >
                    <ScrollArea.Autosize type="scroll" mah={300} viewportRef={scrollAreaRef}>
                        {options}
                        {options.length === 0 && (
                            <Combobox.Empty>Unit not found.</Combobox.Empty>
                        )}
                    </ScrollArea.Autosize>
                    <Combobox.Footer>
                        {showCreateOption && (
                            <Combobox.Option value={trimmedSearch} key="__custom__" onClick={() => handleCreateUnit(trimmedSearch)}>
                                <div className="create-unit-option">
                                    <HiPlus size="1rem" color="var(--mantine-color-gray-7)" />
                                    Create unit "{trimmedSearch}"
                                </div>
                            </Combobox.Option>
                        )}
                    </Combobox.Footer>
                </Combobox.Options>
            </Combobox.Dropdown>
        </Combobox>
    )
}