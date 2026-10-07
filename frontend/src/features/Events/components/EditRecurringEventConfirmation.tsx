import { Button, Group, Modal, Radio, Stack, Text } from "@mantine/core";
import { useState } from "react";

export type EditScope = "this-event" | "all-events";

type Props = {
    opened: boolean;
    onClose: () => void;
    onConfirm: (scope: EditScope) => void | Promise<void>;
    isSaving?: boolean;
};

/**
 * Mirrors DeleteRecurringEventConfirmation's "this vs. all" pattern, but
 * for Save instead of Delete. The difference that keeps this a separate
 * component rather than a shared one: Delete doesn't need any new values
 * from the caller (an id is enough), but a save does -- the edited field
 * values have to already be built by EventForm before this modal can act
 * on either choice, so this component takes a single onConfirm callback
 * instead of owning its own mutations.
 */
export const EditRecurringEventConfirmation = ({ opened, onClose, onConfirm, isSaving }: Props) => {
    const [checked, setChecked] = useState<EditScope>("this-event");

    const handleConfirm = () => {
        onConfirm(checked);
    };

    return (
        <Modal
            title="Edit recurring event"
            opened={opened}
            onClose={onClose}
            size="md"
            centered
            // EventForm's own modal is registered with useModalsStack
            // ('event-form'), which actively manages an elevated z-index
            // for it so it can sit above things like the custom-recurrence
            // editor nested inside it. This modal isn't part of that stack
            // (it doesn't need to be nested inside EventForm's modal, just
            // shown on top of it), so it gets Mantine's ordinary default
            // z-index instead -- which loses to the stack's elevated one.
            // A z-index safely above anything Modal.Stack assigns fixes
            // that without needing to register this in the stack too.
            zIndex={1000}
            onExitTransitionEnd={() => setChecked("this-event")}
        >
            <Text size="sm">
                This event is a recurring event. Do you want to update just this occurrence, or every occurrence in the series?
            </Text>

            <Radio.Group ml="1rem" value={checked} onChange={(value) => setChecked(value as EditScope)}>
                <Stack gap={8} mt="1rem">
                    <Radio
                        label="Just this event"
                        name="recurring-event-edit"
                        value="this-event"
                        color="rgb(5, 5, 73)"
                    />
                    <Radio
                        label="All instances"
                        name="recurring-event-edit"
                        value="all-events"
                        color="rgb(5, 5, 73)"
                    />
                </Stack>
            </Radio.Group>

            <Group justify="flex-end" w="100%" gap="0.5rem" mt="lg">
                <Button
                    fw={500}
                    color="rgb(5, 5, 73)"
                    p=".5rem 1rem"
                    h="auto"
                    size="sm"
                    variant="outline"
                    onClick={onClose}
                    disabled={isSaving}
                >
                    Cancel
                </Button>
                <Button
                    fw={500}
                    color="rgb(5, 5, 73)"
                    p=".5rem 1rem"
                    h="auto"
                    size="sm"
                    variant="filled"
                    onClick={handleConfirm}
                    loading={isSaving}
                >
                    Confirm & Save
                </Button>
            </Group>
        </Modal>
    );
};