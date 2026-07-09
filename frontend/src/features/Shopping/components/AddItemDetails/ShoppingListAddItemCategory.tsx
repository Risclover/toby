import { ActionIcon, Button, CloseIcon, Combobox, Group, Text } from "@mantine/core"
import type { ShoppingList } from "@/store";
import { LuFolder } from "react-icons/lu";
import { FaCheck } from "react-icons/fa6";
import { useShoppingListAddItemCategory } from "../../hooks/useShoppingListAddItemCategory";

type Props = {
    /** List in question */
    list: ShoppingList;
    /** Id of category added */
    categoryId: number | null;
    /** onCommit handler */
    onCommit: (id: number | null) => void;
    /** Close handler */
    onClose: (finalValue?: number | null) => void;
}

/** Category item detail option */
export const ShoppingListAddItemCategory = ({ list, categoryId, onCommit, onClose }: Props) => {
    const {
        categoryCombobox,
        categories,
        handleSubmitCombobox,
        handleClickClose,
        selectedCategory
    } = useShoppingListAddItemCategory({ list, categoryId, onCommit, onClose });

    return (
        <Combobox
            width={250}
            store={categoryCombobox}
            withinPortal={false}
            onOptionSubmit={handleSubmitCombobox}
            shadow="sm"
            styles={{
                option: {
                    fontSize: "var(--text-sm) !important",
                    padding: ".75rem 1rem"
                },
            }}
        >
            <Combobox.Target>
                <Button
                    h={28}
                    p=".25rem .5rem"
                    variant="transparent"
                    size="13px"
                    fw={500}
                    color="var(--mantine-color-gray-7)"
                    className="shopping-list-add-item-detail"
                    onClick={() => categoryCombobox.toggleDropdown()}
                    maw={250}
                >
                    <span className="add-item-detail-icon">
                        <LuFolder />
                    </span>
                    <Text c="black" size="13px" truncate="end">
                        {selectedCategory ? selectedCategory.name : "Category"}
                    </Text>
                    {selectedCategory &&
                        <ActionIcon h="auto" p={0} variant="transparent" size="compact-xs" onClick={handleClickClose} ml=".25rem" style={{ flexShrink: 0 }}>
                            <CloseIcon size=".9rem" color="var(--mantine-color-gray-6)" />
                        </ActionIcon>
                    }
                </Button>
            </Combobox.Target>
            <Combobox.Dropdown>
                <Combobox.Options>
                    {categories.map((cat) => (
                        <Combobox.Option key={cat.id} value={String(cat.id)} active={cat.id === categoryId}>
                            <Group justify="space-between" w="100%" maw="100%">
                                <Text c="black" size="14px" truncate="end" style={{ flex: 1, minWidth: 0 }}>
                                    {cat.name}
                                </Text>
                                {cat.id === categoryId && <FaCheck color="var(--mantine-color-gray-6)" size="1rem" />}
                            </Group>
                        </Combobox.Option>
                    ))}
                </Combobox.Options>
            </Combobox.Dropdown>
        </Combobox>
    );
};