import { useDeleteShoppingItemMutation, type ShoppingItem } from "@/store/shoppingSlice";
import { Button, Group, Modal } from "@mantine/core"

type Props = {
    setShowDeleteConfirmation: (show: boolean) => void;
    showDeleteConfirmation: boolean;
    item: ShoppingItem;
    listId: number;
}
export const ItemDeletionConfirmation = ({ setShowDeleteConfirmation, showDeleteConfirmation, item, listId }: Props) => {
    const [deleteItem] = useDeleteShoppingItemMutation();

    const handleDelete = async () => {
        await deleteItem({ itemId: item.id, listId });
        setShowDeleteConfirmation(false);
    }

    return <Modal styles={{ body: { fontSize: "0.9rem" }, root: { background: "var(--input-background)" } }} centered opened={showDeleteConfirmation} onClose={() => { setShowDeleteConfirmation(false) }} title="Delete Item">
        You are about to delete the item <strong>{item.name}</strong>. Would you like to continue?
        <Group justify="flex-end">
            <Button variant="filled" color="cyan" style={{ marginTop: "1rem", marginLeft: "1rem" }} onClick={() => setShowDeleteConfirmation(false)}>Cancel</Button>
            <Button color="red" style={{ marginTop: "1rem" }} onClick={handleDelete}>Delete</Button>
        </Group>
    </Modal>
}