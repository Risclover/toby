import { Button, Group, Modal, Text } from "@mantine/core"

type Props = {
    itemName?: string;
    itemType?: string;
    modalTitle: string;
    opened: boolean;
    setShowDeleteConfirmation: (val: boolean) => void;
    handleDeleteItem: () => void;
    triggerRef?: React.RefObject<HTMLButtonElement | null>;
}

export const DeleteConfirmation = ({ modalTitle, itemName, itemType, opened, setShowDeleteConfirmation, handleDeleteItem, triggerRef }: Props) => {
    return (
        <Modal size="sm" withCloseButton={false} closeOnClickOutside={false} closeOnEscape={false} radius="md" yOffset="13vh" opened={opened} onClose={() => setShowDeleteConfirmation(false)} title={modalTitle}>
            <Text c="black" size="sm">Are you sure you want to delete {!itemName ? "this " : "the "}{itemType} <strong>{itemName}</strong>? This action cannot be undone.</Text>

            <Group justify="flex-end" w="100%" gap="0.5rem" mt="0.5rem">
                <Button
                    className="tasklist-settings-footer-btn"
                    size="compact-sm"
                    onClick={() => {
                        setShowDeleteConfirmation(false);
                        triggerRef.current?.focus();
                    }}
                    color="var(--mantine-color-dark-6)"
                    variant="outline"
                >
                    Cancel
                </Button>
                <Button
                    className="tasklist-settings-footer-btn"
                    size="compact-sm"
                    onClick={handleDeleteItem}
                    color="red.7"
                >
                    Confirm
                </Button>
            </Group>
        </Modal>
    )
}