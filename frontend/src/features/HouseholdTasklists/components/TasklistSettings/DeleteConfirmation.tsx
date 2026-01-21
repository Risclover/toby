import { Button, Group, Modal, Text } from "@mantine/core"

type Props = {
    opened: boolean;
    setShowDeleteConfirmation: (val: boolean) => void;
    handleDeleteList: () => void;
}
export const DeleteConfirmation = ({ opened, setShowDeleteConfirmation, handleDeleteList }: Props) => {
    return (
        <Modal withCloseButton={false} closeOnClickOutside={false} closeOnEscape={false} radius="md" yOffset="13vh" opened={opened} onClose={() => setShowDeleteConfirmation(false)} title="Confirm delete tasklist">
            <Text c="black" size="sm">Are you sure you want to delete this tasklist? This action cannot be undone.</Text>

            <Group justify="flex-end" w="100%" gap="0.5rem" mt="0.5rem">
                <Button onClick={() => setShowDeleteConfirmation(false)} color="cyan" variant="outline">Cancel</Button>
                <Button onClick={handleDeleteList} color="red.7">Confirm</Button>
            </Group>
        </Modal>
    )
}