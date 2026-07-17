import { ActionIcon, CloseIcon, Button, Combobox, ScrollArea, Text, Tooltip } from "@mantine/core"
import { LuTag } from "react-icons/lu";
import { HiPlus } from "react-icons/hi";
import { FaTrash } from "react-icons/fa";
import { FaCheck } from "react-icons/fa6";
import { useShoppingListAddItemUnit } from "../../hooks/useShoppingListAddItemUnit";

type Props = {
    unit: string;
    quantity: number;
    onCommit: (u: string) => void;
    onClose: (finalValue?: string) => void;
}

export const ShoppingListAddItemUnit = ({ unit, quantity, onCommit, onClose }: Props) => {
    const {
        combobox,
        scrollAreaRef,
        search,
        setSearch,
        trimmedSearch,
        userUnits,
        filteredGroups,
        showCreateOption,
        buttonLabel,
        handleOptionSubmit,
        handleClearUnit,
        handleCreateUnit,
        handleDeleteUnit,
    } = useShoppingListAddItemUnit({ unit, quantity, onCommit, onClose });

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

    return (
        <Combobox
            width="250px"
            store={combobox}
            withinPortal={false}
            onOptionSubmit={handleOptionSubmit}
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
                            handleClearUnit();
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