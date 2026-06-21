import { useGetShoppingListCategoriesQuery, type ShoppingList } from "@/store";
import { Button, CloseIcon, Combobox, Group, Select, useCombobox, Text, ActionIcon } from "@mantine/core"
import { LuFolder } from "react-icons/lu";
import { FaCheck } from "react-icons/fa6";
import { IoClose } from "react-icons/io5";
import { CgClose } from "react-icons/cg";
import { AiOutlineClose } from "react-icons/ai";

type Props = {
    list: ShoppingList;
    category: string;
    onCommit: (c: string) => void;
    onClose: (finalValue?: string) => void;
}
export const ShoppingListAddItemCategory = ({ list, category, onCommit, onClose }: Props) => {
    const combobox = useCombobox({
        onDropdownClose: () => combobox.resetSelectedOption()
    })

    const { data: listCategories } = useGetShoppingListCategoriesQuery(list.id);

    const options = listCategories?.map(category => category.name) ?? [];

    return (
        <Combobox
            width={250}
            store={combobox}
            withinPortal={false}
            onOptionSubmit={(val) => {
                const newValue = val === category ? "" : val;
                onCommit(newValue);
                onClose(newValue);
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
                        {category.length === 0 ? "Category" : category}
                    </Text>
                    {category.length > 0 &&
                        <ActionIcon h="auto" p={0} variant="transparent" size="compact-xs" onClick={(e) => {
                            e.stopPropagation();
                            onCommit("");
                            onClose("");
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
                    {options.map((option) => (
                        <Combobox.Option key={option} value={option} active={option === category}>
                            <Group justify="space-between" w="100%" maw="100%">
                                <Text c="black" size="14px" truncate="end" style={{ flex: 1, minWidth: 0 }}>{option}</Text>
                                {option === category && <FaCheck color="var(--mantine-color-gray-6)" size="1rem" />}
                            </Group>
                        </Combobox.Option>
                    ))}
                </Combobox.Options>
            </Combobox.Dropdown>
        </Combobox >
    )
}