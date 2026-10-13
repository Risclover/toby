import { useState } from "react";

import { Group, Modal, Radio, Stack, Text } from "@mantine/core";

import { ButtonStandard } from "@/components/ButtonStandard";

export const EDIT_SCOPE = { THIS: "this-event", ALL: "all-events" } as const;
export type EditScope = (typeof EDIT_SCOPE)[keyof typeof EDIT_SCOPE];

const RADIO_NAME = "recurring-event-edit";
// This modal isn't part of EventForm's modals stack, so it needs a z-index above the stack's elevated one.
const MODAL_Z_INDEX = 1000;

const SCOPE_OPTIONS = [
    { label: "Just this event", value: EDIT_SCOPE.THIS },
    { label: "All instances", value: EDIT_SCOPE.ALL },
] as const;

type EditRecurringEventConfirmationProps = {
    opened: boolean;
    onClose: () => void;
    onConfirm: (scope: EditScope) => void | Promise<void>;
    isSaving?: boolean;
};

/**
 * "This vs. all" prompt for saving a recurring event. Unlike the delete version, the edited
 * values already exist in EventForm, so this takes one onConfirm callback instead of owning mutations.
 */
export const EditRecurringEventConfirmation = ({
    opened,
    onClose,
    onConfirm,
    isSaving,
}: EditRecurringEventConfirmationProps) => {
    const [scope, setScope] = useState<EditScope>(EDIT_SCOPE.THIS);

    const handleScopeChange = (value: string) => setScope(value as EditScope);
    const handleConfirm = () => onConfirm(scope);

    return (
        <Modal
            title="Edit recurring event"
            opened={opened}
            onClose={onClose}
            size="md"
            centered
            zIndex={MODAL_Z_INDEX}
            onExitTransitionEnd={() => setScope(EDIT_SCOPE.THIS)}
        >
            <Text size="sm">
                This event is a recurring event. Do you want to update just this occurrence, or every occurrence in the series?
            </Text>

            <Radio.Group ml="1rem" value={scope} onChange={handleScopeChange}>
                <Stack gap={8} mt="1rem">
                    {SCOPE_OPTIONS.map((option) => (
                        <Radio key={option.value} name={RADIO_NAME} color="navy" {...option} />
                    ))}
                </Stack>
            </Radio.Group>

            <Group justify="flex-end" w="100%" gap="0.5rem" mt="lg">
                <ButtonStandard
                    label="Cancel"
                    variant="outline"
                    onClick={onClose}
                    disabled={isSaving}
                />
                <ButtonStandard
                    label="Confirm & Save"
                    variant="filled"
                    onClick={handleConfirm}
                    isLoading={isSaving}
                />
            </Group>
        </Modal>
    );
};