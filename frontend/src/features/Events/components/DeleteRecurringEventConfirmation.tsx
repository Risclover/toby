import { Button, Group, Modal, Radio, Stack, Text } from "@mantine/core"
import { useState } from "react";

type Props = {
    opened: boolean;
    onClose: () => void;
}
export const DeleteRecurringEventConfirmation = ({ opened, onClose }: Props) => {
    const [checked, setChecked] = useState("one-event");

    return (
        <Modal
            title="Delete recurring event"
            opened={opened}
            onClose={onClose}
            size="sm"
            onExitTransitionEnd={() => setChecked('one-event')}
        >
            <Text size="sm" >This event is a recurring event. Do you want to delete this specific single event, or all instances of it?</Text>

            <Radio.Group ml="1rem" value={checked} onChange={setChecked}>
                <Stack gap={8} mt="1rem">
                    <Radio
                        label="Just this event"
                        name="recurring-event"
                        value="one-event"
                        color="rgb(5, 5, 73)"
                    />
                    <Radio
                        label="All instances"
                        name="recurring-event"
                        value="all-events"
                        color="rgb(5, 5, 73)"
                    />
                </Stack>
            </Radio.Group>
            <Text size="sm" c="gray.9" lh={1.2} my="1rem"><strong>Note</strong>: Once you click submit, you can't bring it back - are you sure?</Text>
            <Group w="100%" justify="flex-end">
                <Button
                    fw={500}
                    color="rgb(5, 5, 73)"
                    p=".5rem 1rem"
                    h="auto"
                    size="sm"
                    variant="outline"
                    onClick={onClose}
                >
                    Cancel
                </Button>
                <Button
                    fw={500}
                    color="red"
                    p=".5rem 1rem"
                    h="auto"
                    size="sm"
                    variant="filled"
                >
                    Confirm & Delete
                </Button>
            </Group>

        </Modal >
    )
}