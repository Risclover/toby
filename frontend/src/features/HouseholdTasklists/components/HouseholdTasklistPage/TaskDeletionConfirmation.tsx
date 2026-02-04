import { useDeleteTaskMutation } from "@/store/taskSlice";
import { Button, Group, Modal, Space, Text } from "@mantine/core"
import { notifications } from "@mantine/notifications";

type Props = {
    title: string;
    opened: boolean;
    onClose: () => void;
    listId: number;
    taskId: number;
}

export const TaskDeletionConfirmation = ({ title, opened, onClose, listId, taskId }: Props) => {
    const [deleteTask] = useDeleteTaskMutation();

    const handleTaskDeletion = async () => {
        await deleteTask({ listId, taskId });
        onClose();
        notifications.show({
            message: "Task deleted successfully.",
            color: 'cyan',
            position: 'bottom-center',
            autoClose: 5000,
        });
    }

    return <Modal size="sm" withCloseButton={false} closeOnClickOutside={false} closeOnEscape={false} radius="md" yOffset="13vh" onClose={onClose} opened={opened} title="Confirm delete task">
        <Text size="sm" c="black">Are you sure you want to delete the task <strong className="task-deletion-title">{title}</strong>? This action cannot be undone.</Text>
        <Space h="md" />
        <Group justify="flex-end">
            <Button className="tasklist-settings-footer-btn" size="compact-sm" radius="sm" variant="outline" color="var(--tasklist-color)" onClick={onClose}>Cancel</Button>
            <Button className="tasklist-settings-footer-btn" size="compact-sm" color="red" radius="sm" variant="" onClick={handleTaskDeletion}>Confirm</Button>
        </Group>
    </Modal>
}