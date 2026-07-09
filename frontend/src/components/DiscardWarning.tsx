import type { ShoppingList } from "@/store";
import { Button, Group, Modal, Text } from "@mantine/core"
import { list } from "postcss";

type Props = {
    opened: boolean;
    handleClose: () => void;
    setShowDiscardWarning: (val: boolean) => void;
    discardNote?: boolean;
    shoppingList?: ShoppingList | null;
}

export const DiscardWarning = ({ opened, setShowDiscardWarning, handleClose, discardNote, shoppingList }: Props) => {
    return (
        <Modal centered radius="md" yOffset='13vh' zIndex={99999} withCloseButton={false} closeOnClickOutside={false} closeOnEscape={false} size="sm" opened={opened} onClose={handleClose} title="Discard unsaved changes?" styles={{
            body: { padding: 0 },
            header: { paddingTop: 0, paddingBottom: 0 }
        }}>
            <Text px={15} c="black" size="sm">You're about to discard unsaved changes. Any changes you've made will be gone forever.</Text>
            <Modal.Header component={'footer'} pos={'sticky'} bottom={0} style={{ borderRadius: 0 }}>
                <Group justify="flex-end" w="100%" gap="0.5rem" mt="md" mb="sm">
                    <Button className="tasklist-settings-footer-btn" size="compact-sm" variant="outline" color={discardNote ? "rgb(5, 5, 73)" : shoppingList ? shoppingList.color : "var(--tasklist-color)"} onClick={() => setShowDiscardWarning(false)} fw={500}>Cancel</Button>
                    <Button className="tasklist-settings-footer-btn" size="compact-sm" variant="filled" color={discardNote ? "rgb(5, 5, 73)" : shoppingList ? shoppingList.color : "var(--tasklist-color)"} onClick={handleClose} fw={500}>Discard</Button>
                </Group>
            </Modal.Header>
        </Modal>
    )
}