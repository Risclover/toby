import { useGetShoppingListCategoriesQuery, type ShoppingList } from "@/store";
import { ActionIcon, Button, CloseIcon, Combobox, Group, Text, useCombobox } from "@mantine/core"
import { LuFolder } from "react-icons/lu";
import { FaCheck } from "react-icons/fa6";

type Props = {
    list: ShoppingList;
    categoryId: number | null;
    onCommit: (id: number | null) => void;
    onClose: (finalValue?: number | null) => void;
}
export const ShoppingListAddItemCategory = ({ list, categoryId, onCommit, onClose }: Props) => {
    const combobox = useCombobox({
        onDropdownClose: () => combobox.resetSelectedOption()
    })

    const { data: listCategories } = useGetShoppingListCategoriesQuery(list.id);

    const selectedCategory = listCategories?.find((c) => c.id === categoryId);

    return (
        <Combobox
            width={250}
            store={combobox}
            withinPortal={false}
            onOptionSubmit={(val) => {
                const selectedId = Number(val);
                const newId = selectedId === categoryId ? null : selectedId;
                onCommit(newId);
                onClose(newId);
                combobox.closeDropdown();
            }}
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
                    onClick={() => combobox.toggleDropdown()}
                    maw={250}
                >
                    <span className="add-item-detail-icon">
                        <LuFolder />
                    </span>
                    <Text c="black" size="13px" truncate="end">
                        {selectedCategory ? selectedCategory.name : "Category"}
                    </Text>
                    {selectedCategory &&
                        <ActionIcon h="auto" p={0} variant="transparent" size="compact-xs" onClick={(e) => {
                            e.stopPropagation();
                            onCommit(null);
                            onClose(null);
                            combobox.closeDropdown();
                        }}
                            ml=".25rem"
                            style={{ flexShrink: 0 }}
                        >
                            <CloseIcon size=".9rem" color="var(--mantine-color-gray-6)" />
                        </ActionIcon>
                    }
                </Button>
            </Combobox.Target>
            <Combobox.Dropdown>
                <Combobox.Options>
                    {listCategories?.map((cat) => (
                        <Combobox.Option key={cat.id} value={String(cat.id)} active={cat.id === categoryId}>
                            <Group justify="space-between" w="100%" maw="100%">
                                <Text c="black" size="14px" truncate="end" style={{ flex: 1, minWidth: 0 }}>{cat.name}</Text>
                                {cat.id === categoryId && <FaCheck color="var(--mantine-color-gray-6)" size="1rem" />}
                            </Group>
                        </Combobox.Option>
                    ))}
                </Combobox.Options>
            </Combobox.Dropdown>
        </Combobox>
    )
}