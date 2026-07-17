import { useRef } from "react";
import { ActionIcon, CloseIcon, Combobox, InputBase, ScrollArea, Text, useCombobox } from "@mantine/core";
import { getUnitLabel } from "../../constants/shoppingUnits";
import { useUnitOptions } from "../../hooks/useUnitOptions";
import { FaTrash, FaCheck } from "react-icons/fa6";
import { HiPlus } from "react-icons/hi";

type Props = {
    unit: string;
    quantity: number;
    onCommit: (u: string) => void;
}

export const ShoppingListDetailUnitInput = ({ unit, quantity, onCommit }: Props) => {
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    const combobox = useCombobox({
        onDropdownClose: () => {
            combobox.resetSelectedOption();
        },
        onDropdownOpen: () => {
            combobox.focusSearchInput();
            requestAnimationFrame(() => {
                scrollAreaRef.current?.scrollTo({ top: 0 });
            });
        }
    });

    const {
        search,
        setSearch,
        trimmedSearch,
        filteredGroups,
        showCreateOption,
        userUnits,
        handleCreateUnit,
        handleDeleteUnit,
    } = useUnitOptions(unit, onCommit, () => combobox.closeDropdown());

    const options = filteredGroups.map((group) => (
        <Combobox.Group key={group.groupName} label={group.groupName}>
            {group.items.map((item) => {
                const isCustom = group.groupName === "Custom";
                const customUnitId = isCustom
                    ? userUnits?.find((u) => u.name === item.value)?.id
                    : undefined;

                return (
                    <Combobox.Option
                        key={item.value}
                        value={item.value}
                        active={item.value === unit}
                        style={item.value === unit ? { backgroundColor: "var(--mantine-color-gray-0)" } : undefined}
                    >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                            <span>{quantity === 1 ? item.singular : item.plural}</span>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                {isCustom && customUnitId !== undefined && (
                                    <ActionIcon variant="transparent" size="xs">
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

    const buttonLabel = unit.length > 0 ? getUnitLabel(unit, quantity) : null;
    return (
        <Combobox
            store={combobox}
            onOptionSubmit={(val) => {
                onCommit(val === unit ? "" : val);
                combobox.closeDropdown();
            }}
            styles={{
                option: { fontSize: "var(--text-sm) !important" },
                footer: { padding: 0 },
            }}
        >
            <Combobox.Target>
                <InputBase
                    component="button"
                    type="button"
                    pointer
                    disabled={quantity === 0}
                    rightSection={
                        unit.length > 0 ? (
                            <ActionIcon
                                variant="subtle"
                                color="var(--mantine-color-gray-6)"
                                size="xs"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onCommit("");
                                    combobox.closeDropdown();
                                }}
                            >
                                <CloseIcon size=".9rem" color="var(--mantine-color-gray-6)" />
                            </ActionIcon>
                        ) : (
                            <Combobox.Chevron />
                        )
                    }
                    rightSectionPointerEvents={unit.length > 0 ? "all" : "none"}
                    onClick={() => combobox.toggleDropdown()}
                >
                    <Text size="sm" c={buttonLabel ? "black" : "dimmed"} truncate="end">
                        {buttonLabel ?? "Select unit"}
                    </Text>
                </InputBase>
            </Combobox.Target>
            <Combobox.Dropdown>
                <Combobox.Search
                    value={search}
                    onChange={(e) => setSearch(e.currentTarget.value)}
                    placeholder="Search units"
                    maxLength={15}
                />
                <Combobox.Options>
                    <ScrollArea.Autosize type="scroll" mah={300} viewportRef={scrollAreaRef}>
                        {options.length === 0
                            ? <Combobox.Empty>Unit not found.</Combobox.Empty>
                            : options
                        }
                    </ScrollArea.Autosize>
                    <Combobox.Footer>
                        {showCreateOption && (
                            <Combobox.Option value={trimmedSearch} key="__custom__" onClick={handleCreateUnit}>
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
    );
};