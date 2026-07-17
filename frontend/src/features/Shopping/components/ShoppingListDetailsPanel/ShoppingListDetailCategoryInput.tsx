import { useRef } from "react";
import { ActionIcon, CloseIcon, Combobox, Group, InputBase, ScrollArea, Text, useCombobox } from "@mantine/core";
import { useShoppingListCategories } from "../../hooks/useShoppingListCategories";
import type { ShoppingList } from "@/store";
import { FaCheck } from "react-icons/fa6";

type Props = {
    list: ShoppingList;
    categoryId: number | null;
    onCommit: (id: number | null) => void;
}

export const ShoppingListDetailCategoryInput = ({ list, categoryId, onCommit }: Props) => {
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const combobox = useCombobox({
        onDropdownClose: () => combobox.resetSelectedOption(),
        onDropdownOpen: () => {
            requestAnimationFrame(() => {
                scrollAreaRef.current?.scrollTo({ top: 0 });
            });
        }
    });

    const { categories } = useShoppingListCategories(list?.id);
    const selectedCategory = categories.find((c) => c.id === categoryId);

    const handleSubmit = (val: string) => {
        const selectedId = Number(val);
        onCommit(selectedId === categoryId ? null : selectedId);
        combobox.closeDropdown();
    };

    return (
        <Combobox
            store={combobox}
            onOptionSubmit={handleSubmit}
            withinPortal={false}
            styles={{
                option: {
                    fontSize: "var(--text-sm) !important",
                    padding: ".75rem 1rem"
                },
                options: {
                    maxHeight: "300px"
                }
            }}
        >
            <Combobox.Target>
                <InputBase
                    component="button"
                    type="button"
                    pointer
                    rightSection={
                        selectedCategory ? (
                            <ActionIcon
                                variant="subtle"
                                color="var(--mantine-color-gray-6)"
                                size="xs"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onCommit(null);
                                    combobox.closeDropdown();
                                }}
                            >
                                <CloseIcon size=".9rem" color="var(--mantine-color-gray-6)" />
                            </ActionIcon>
                        ) : (
                            <Combobox.Chevron />
                        )
                    }
                    rightSectionPointerEvents={selectedCategory ? "all" : "none"}
                    onClick={() => combobox.toggleDropdown()}
                >
                    <Text size="sm" c={selectedCategory ? "black" : "dimmed"} truncate="end">
                        {selectedCategory ? selectedCategory.name : "Select category"}
                    </Text>
                </InputBase>
            </Combobox.Target>
            <Combobox.Dropdown>
                <Combobox.Options>
                    <ScrollArea.Autosize type="scroll" mah={250} viewportRef={scrollAreaRef}>
                        {categories.length === 0
                            ? <Combobox.Empty>No categories yet.</Combobox.Empty>
                            : categories.map((cat) => (
                                <Combobox.Option key={cat.id} value={String(cat.id)} active={cat.id === categoryId}>
                                    <Group justify="space-between" w="100%" maw="100%">
                                        <Text c="black" size="14px" truncate="end" style={{ flex: 1, minWidth: 0 }}>
                                            {cat.name}
                                        </Text>
                                        {cat.id === categoryId && <FaCheck color="var(--mantine-color-gray-6)" size="1rem" />}
                                    </Group>
                                </Combobox.Option>
                            ))
                        }
                    </ScrollArea.Autosize>
                </Combobox.Options>
            </Combobox.Dropdown>
        </Combobox>
    );
};