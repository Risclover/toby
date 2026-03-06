import { Button, Group, Modal, Text } from "@mantine/core"

type Props = {
    opened: boolean;
    handleClose: () => void;
    setShowDiscardWarning: (val: boolean) => void;
}

export const DiscardWarning = ({ opened, setShowDiscardWarning, handleClose }: Props) => {
    return (
        <Modal radius="md" yOffset='13vh' zIndex={99999} withCloseButton={false} closeOnClickOutside={false} closeOnEscape={false} size="sm" opened={opened} onClose={handleClose} title="Discard unsaved changes?" styles={{
            body: { padding: 0 },
            header: { paddingTop: 0, paddingBottom: 0 }
        }}>
            <Text px={15} c="black" size="sm">Your unsaved changes will be discarded.</Text>
            <Modal.Header component={'footer'} pos={'sticky'} bottom={0} style={{ borderRadius: 0 }}>
                <Group justify="flex-end" w="100%" gap="0.5rem">
                    <Button className="tasklist-settings-footer-btn" size="compact-sm" variant="outline" color="var(--tasklist-color)" onClick={() => setShowDiscardWarning(false)} fw={500}>Cancel</Button>
                    <Button className="tasklist-settings-footer-btn" size="compact-sm" variant="filled" color="var(--tasklist-color)" onClick={handleClose} fw={500}>Discard</Button>
                </Group>
            </Modal.Header>
        </Modal>
    )
}