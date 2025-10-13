import { Button, Group, Modal, Text } from "@mantine/core"

type Props = {
    opened: boolean;
    close: () => void;
}

export const ManageCategoriesModal = ({ opened, close }: Props) => {
    return <>
        <Modal opened={opened} onClose={close} size="auto" title="Modal size auto">
            <Text>Modal with size auto will fits its content</Text>

            <Group wrap="nowrap" mt="md">
                {badges}
            </Group>

            <Group mt="xl">
                <Button onClick={increment}>Add badge</Button>
                <Button onClick={decrement}>Remove badge</Button>
            </Group>
        </Modal>

        <Button variant="default" onClick={open}>
            Open modal
        </Button>
    </>
}