import { useUnarchiveListMutation } from "@/store";
import { Button, Stack } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useNavigate } from "react-router-dom";

export const useUndoArchive = ({ tasklistId }: { tasklistId: number }) => {
    const navigate = useNavigate();
    const [unarchiveList] = useUnarchiveListMutation();

    const handleUndoArchive = async () => {
        await unarchiveList({ listId: Number(tasklistId) }).unwrap();

        notifications.show({
            onOpen: () => {
                // 3. Use a slightly longer delay to beat the entrance animation
                window.setTimeout(() => {
                    const btn = document.querySelector('.notify-focus-target') as HTMLElement;
                    if (btn) {
                        btn.focus();
                    }
                }, 150);
            },
            color: 'cyan',
            position: 'bottom-center',
            autoClose: 5000,
            message: (
                <Stack
                    align="flex-start"
                    gap="xs">
                    List unarchived successfully.
                    <Button
                        className="notify-focus-target"
                        variant="filled"
                        size="compact-xs"
                        color="cyan"
                        onClick={() => navigate(`/tasklists/${tasklistId}`)}
                        styles={{
                            label: { fontWeight: 400 }
                        }}
                    >
                        View tasklist
                    </Button></Stack>
            )
        })
    }

    return { handleUndoArchive }
}