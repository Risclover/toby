import { Button, Group, Popover, Stack, Text } from "@mantine/core"
import { useState } from "react"
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import { useDeleteShoppingCategoryMutation, type ShoppingCategory } from "@/store/categorySlice";

type Props = {
    listId: number;
    cat: ShoppingCategory;
}
export const DeleteCategoryPopover = ({ listId, cat }: Props) => {
    const [deleteCategory] = useDeleteShoppingCategoryMutation();
    const [showPopover, setShowPopover] = useState(false);

    const handleDeleteCategory = async (cat: ShoppingCategory) => {
        const data = await deleteCategory({ id: cat.id, listId }).unwrap();
        console.log("deleted:", data);
    };
    return (
        <Popover onChange={setShowPopover} opened={showPopover} arrowSize={12} width={200} position="right" withArrow shadow="md">
            <Popover.Target>
                <Button size="xs" color="red" onClick={() => setShowPopover(true)}>
                    <DeleteRoundedIcon style={{ fontSize: "1.1rem" }} />
                </Button>
            </Popover.Target>
            <Popover.Dropdown>
                <Stack gap="sm">
                    <Text ta="center" c="white" size="sm">Are you sure you want to delete this category?</Text>
                    <Group justify="center">
                        <Button onClick={() => setShowPopover(false)} size="xs" color="cyan.5" variant="outline">Cancel</Button>
                        <Button size="xs" color="red" onClick={() => handleDeleteCategory(cat)}>Delete</Button>
                    </Group>
                </Stack>
            </Popover.Dropdown>
        </Popover>
    )
}