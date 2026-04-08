import { Button, Group, Modal, Text } from "@mantine/core"

type Props = {
    opened: boolean;
    close: () => void;
    count: number;
    handleDelete: () => void;
}
export const MassDeleteConfirmation = ({ opened, close, count, handleDelete }: Props) => {
    return (
        <Modal size="sm" withCloseButton={false} closeOnClickOutside={false} closeOnEscape={false} radius="md" yOffset="13vh" opened={opened} onClose={close} title="Bulk delete tasks">
            <Text c="black" size="sm" style={{ lineHeight: 1.2 }}>Are you sure you want to permanently delete <strong style={{ fontWeight: 600 }}>{count} task{count !== 1 && "s"}</strong> from your list of time-sensitive tasks? This action cannot be undone.</Text>

            <Group justify="flex-end" w="100%" gap="0.5rem" mt="0.5rem">
                <Button
                    className="tasklist-settings-footer-btn"
                    size="compact-sm"
                    onClick={() => {
                        close();
                    }}
                    color="var(--mantine-color-dark-6)"
                    variant="outline"
                >
                    Cancel
                </Button>
                <Button
                    className="tasklist-settings-footer-btn"
                    size="compact-sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDelete();
                    }}
                    color="red.7"
                >
                    Confirm
                </Button>
            </Group>
        </Modal>
    )
}