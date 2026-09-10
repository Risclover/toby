import type { ShoppingList } from "@/store";
import { Button, Group, Modal, Text } from "@mantine/core"
import { list } from "postcss";
import { ModalFooter } from "./ModalFooter";
import { ButtonStandard } from "./ButtonStandard";

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
            <ModalFooter>
                <Group justify="flex-end" w="100%" gap="0.5rem" mt="md" mb="sm">
                    <ButtonStandard
                        label="Cancel"
                        variant="outline"
                        color={discardNote ? "rgb(5, 5, 73)" : shoppingList ? shoppingList.color : "var(--tasklist-color)"}
                        onClick={() => setShowDiscardWarning(false)}
                    />
                    <ButtonStandard
                        label="Discard"
                        color={discardNote ? "rgb(5, 5, 73)" : shoppingList ? shoppingList.color : "var(--tasklist-color)"}
                        onClick={handleClose}
                        variant="filled"
                    />
                </Group>
            </ModalFooter>
        </Modal>
    )
}