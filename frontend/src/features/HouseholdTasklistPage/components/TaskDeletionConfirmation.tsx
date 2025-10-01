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
        <Text size="sm">You are about to delete the task <strong>{title}</strong>. Would you like to continue?</Text>
        <Space h="md" />
        <Group justify="flex-end">
            <Button color="cyan" variant="outline" onClick={onClose}>Cancel</Button>
            <Button color="red" variant="" onClick={handleTaskDeletion}>Delete</Button>
        </Group>
    </Modal>
}