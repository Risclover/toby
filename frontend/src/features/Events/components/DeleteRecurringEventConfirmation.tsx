import { Button, Group, Modal, Radio, Stack, Text } from "@mantine/core"
import { useState } from "react";
import type { Occurrence } from "../types";
import { useDeleteEventMutation, useExcludeEventOccurrenceMutation } from "@/store";

type Props = {
    opened: boolean;
    onClose: () => void;
    occurrence: Occurrence;
    occurrenceStart: Date | string;
}
export const DeleteRecurringEventConfirmation = ({ opened, onClose, occurrence, occurrenceStart }: Props) => {
    const [checked, setChecked] = useState("one-event");
    const [excludeEventOccurrence, { isLoading: excluding }] = useExcludeEventOccurrenceMutation();
    const [deleteEvent, { isLoading: deleting }] = useDeleteEventMutation();
    const isDeleting = excluding || deleting;

    const handleDeleteSingleEvent = async () => {
        try {
            await excludeEventOccurrence({
                id: occurrence.payload?.source.id,
                householdId: occurrence.payload?.source.householdId,
                occurrenceStart
            }).unwrap();
            onClose();
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteAllInstances = async () => {
        try {
            await deleteEvent({
                id: occurrence.payload?.source.id,
                householdId: occurrence.payload?.source.householdId
            }).unwrap();
            onClose();
        } catch (e) {
            console.error(e);
        }
    };

    const handleConfirm = () => {
        if (checked === "one-event") {
            handleDeleteSingleEvent();
        } else {
            handleDeleteAllInstances();
        }
    }

    return (
        <Modal
            title="Delete recurring event"
            opened={opened}
            onClose={onClose}
            size="sm"
            centered
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
                    disabled={isDeleting}
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
                    onClick={handleConfirm}
                    loading={isDeleting}
                >
                    Confirm & Delete
                </Button>
            </Group>

        </Modal >
    )
}