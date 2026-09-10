import { Button, Group, Modal, Text } from "@mantine/core"
import { ButtonStandard } from "./ButtonStandard";

type Props = {
    itemName?: string;
    itemType?: string;
    modalTitle: string;
    opened: boolean;
    setShowDeleteConfirmation: (val: boolean) => void;
    handleDeleteItem: () => void;
    triggerRef?: React.RefObject<HTMLButtonElement | null>;
    stack?: any;
    zIndex?: number;
}

export const DeleteConfirmation = ({ modalTitle, itemName, itemType, opened, setShowDeleteConfirmation, handleDeleteItem, triggerRef, zIndex }: Props) => {
    return (
        <Modal zIndex={zIndex} centered size="sm" withCloseButton={false} closeOnClickOutside={false} closeOnEscape={false} radius="md" yOffset="13vh" opened={opened} onClose={() => setShowDeleteConfirmation(false)} title={modalTitle} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") e.stopPropagation(); return; }} onClick={(e) => e.stopPropagation()}>
            <Text c="black" size="sm"  >Are you sure you want to delete {itemType === "tasks" ? "these " : !itemName ? "this " : "the "}{itemType} <span className="delete-item-name">{itemName}</span>? Once it's gone, it's gone. This action can't be undone.</Text>

            <Group justify="flex-end" w="100%" gap="0.5rem" mt="md">
                <ButtonStandard
                    onClick={() => {
                        setShowDeleteConfirmation(false);
                        triggerRef?.current?.focus();
                    }}
                    color="var(--mantine-color-dark-6)"
                    variant="outline"
                    label="Cancel"
                />
                <ButtonStandard
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteItem();
                    }}
                    variant="filled"
                    color="red.7"
                    label="Confirm"
                />
            </Group>
        </Modal >
    )
}