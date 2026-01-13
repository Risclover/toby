import { useDeleteTodoMutation } from "@/store/todoSlice";
import { Button, Group, Modal, Space, Text } from "@mantine/core"

type Props = {
    title: string;
    opened: boolean;
    onClose: () => void;
    listId: number;
    todoId: number;
}

export const TaskDeletionConfirmation = ({ title, opened, onClose, listId, todoId }: Props) => {
    const [deleteTodo] = useDeleteTodoMutation();

    const handleTaskDeletion = async () => {
        await deleteTodo({ listId, todoId });
        onClose();
    }

    return <Modal onClose={onClose} opened={opened} title="Delete Task" centered>
        <Text size="sm" c="white">You are about to delete the task <strong className="task-deletion-title">{title}</strong>. Would you like to continue?</Text>
        <Space h="md" />
        <Group justify="flex-end">
            <Button size="compact-sm" radius="xl" variant="subtle" color="cyan.5" onClick={onClose}>Cancel</Button>
            <Button size="compact-sm" color="red" radius="xl" variant="" onClick={handleTaskDeletion}>Confirm</Button>
        </Group>
    </Modal>
}