import { useState } from "react";

import { Group, Modal, Radio, Stack, Text } from "@mantine/core";

import { ButtonStandard } from "@/components/ButtonStandard";
import { useDeleteEventMutation, useExcludeEventOccurrenceMutation } from "@/store";

import type { Occurrence } from "../types";

const DELETE_SCOPE = { ONE: "one-event", ALL: "all-events" } as const;
const RADIO_NAME = "recurring-event";
const RADIO_COLOR = "rgb(5, 5, 73)";

const SCOPE_OPTIONS = [
    { label: "Just this event", value: DELETE_SCOPE.ONE },
    { label: "All instances", value: DELETE_SCOPE.ALL },
] as const;

type DeleteRecurringEventConfirmationProps = {
    opened: boolean;
    onClose: () => void;
    occurrence: Occurrence;
    occurrenceStart: Date | string;
};

export const DeleteRecurringEventConfirmation = ({
    opened,
    onClose,
    occurrence,
    occurrenceStart,
}: DeleteRecurringEventConfirmationProps) => {
    const [scope, setScope] = useState<string>(DELETE_SCOPE.ONE);
    const [excludeEventOccurrence, { isLoading: excluding }] = useExcludeEventOccurrenceMutation();
    const [deleteEvent, { isLoading: deleting }] = useDeleteEventMutation();
    const isDeleting = excluding || deleting;

    const source = occurrence.payload?.source;

    const handleConfirm = async () => {
        const target = { id: source?.id, householdId: source?.householdId };

        try {
            if (scope === DELETE_SCOPE.ONE) {
                await excludeEventOccurrence({ ...target, occurrenceStart }).unwrap();
            } else {
                await deleteEvent(target).unwrap();
            }
            onClose();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <Modal
            title="Delete recurring event"
            opened={opened}
            onClose={onClose}
            size="md"
            centered
            onExitTransitionEnd={() => setScope(DELETE_SCOPE.ONE)}
        >
            <Text size="sm">
                This event is a recurring event. Do you want to delete this specific single event, or all instances of it?
            </Text>

            <Radio.Group ml="1rem" value={scope} onChange={setScope}>
                <Stack gap={8} mt="1rem">
                    {SCOPE_OPTIONS.map((option) => (
                        <Radio key={option.value} name={RADIO_NAME} color={RADIO_COLOR} {...option} />
                    ))}
                </Stack>
            </Radio.Group>

            <Text size="sm" c="gray.9" lh={1.2} my="1rem">
                <strong>Note</strong>: Once you click submit, you can't bring it back - are you sure?
            </Text>

            <Group justify="flex-end" w="100%" gap="0.5rem" mt="md">
                <ButtonStandard
                    label="Cancel"
                    variant="outline"
                    onClick={onClose}
                    disabled={isDeleting}
                />
                <ButtonStandard
                    label="Confirm & Delete"
                    color="red"
                    variant="filled"
                    onClick={handleConfirm}
                    isLoading={isDeleting}
                />
            </Group>
        </Modal>
    );
};