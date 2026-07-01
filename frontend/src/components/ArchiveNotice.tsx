import { Alert, Button, Text } from '@mantine/core';
import { ArchivedIcon } from '@/assets';
import { useUndoArchive } from '../features/HouseholdTasklists/hooks';
import { useUnarchiveShoppingListMutation } from '..';
import { useHousehold } from '@/hooks/useHousehold';

type Props = {
    listId: number;
    itemType: "tasklist" | "shoppinglist";
}
export const ArchiveNotice = ({ listId, itemType }: Props) => {
    const { data: household } = useHousehold();
    const { handleUndoArchive } = useUndoArchive({ tasklistId: listId });
    const [unarchiveShoppingList] = useUnarchiveShoppingListMutation();

    const handleUnarchiveList = async () => {
        if (itemType === "tasklist") {
            handleUndoArchive();
        } else if (itemType === "shoppinglist") {
            try {
                await unarchiveShoppingList({ listId, householdId: household?.id }).unwrap();
            } catch (err) {
                console.error("Failed to unarchive shopping list:", err);
            }
        }
    }
    const restoreButton = <span className="restore-list-btn" onClick={handleUnarchiveList}>restored</span>

    return (
        <Alert
            variant="light"
            radius="xs"
            color="rgba(204, 143, 0, 1)"
            bg="rgb(255, 249, 225)"
            title="This list was archived."
            icon={<ArchivedIcon size="6rem" color="currentColor" />}
            styles={{
                root: { boxShadow: "var(--mantine-shadow-xs)", border: "1px solid transparent" },
                title: { fontFamily: "Alan Sans", fontWeight: 500 },
                message: { lineHeight: 1.3 },
                icon: { width: "6.5rem !important" }
            }}
        >
            Read-only mode active. Actions are disabled until this list is {restoreButton}.
        </Alert >
    );
};