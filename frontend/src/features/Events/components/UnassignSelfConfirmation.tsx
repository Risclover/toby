import { Group, Modal, Text } from "@mantine/core";

import { KittyIcons } from "@/assets";
import { KittyNotification } from "@/components";
import { ButtonStandard } from "@/components/ButtonStandard";
import { useAuthenticateQuery, useUnassignSelfMutation } from "@/store";

import type { Occurrence } from "../types";

const TOAST_TITLE_PROPS = { span: true, inherit: true, fw: 500 } as const;
const DIALOG_TITLE_PROPS = { span: true, inherit: true, fw: 600 } as const;

const notifyLeftEvent = (title?: string) =>
    KittyNotification({
        title: "Successfully left the event",
        message: (
            <>
                You're way too cool to show up to "<Text {...TOAST_TITLE_PROPS}>{title}</Text>". Let's do something else instead!
            </>
        ),
        color: "green",
        icon: KittyIcons.Cellphone,
    });

type UnassignSelfConfirmationProps = {
    opened: boolean;
    onClose: () => void;
    occurrence: Occurrence;
};

export const UnassignSelfConfirmation = ({
    opened,
    onClose,
    occurrence,
}: UnassignSelfConfirmationProps) => {
    const { data: currentUser } = useAuthenticateQuery();
    const [unassignSelf] = useUnassignSelfMutation();

    const source = occurrence.payload?.source;
    const eventTitle = source?.title;
    const isOnlyAssignee =
        source?.attendeeIds.length === 1 && source.attendeeIds.includes(currentUser.id);

    const handleUnassignSelf = async () => {
        await unassignSelf({
            id: Number(source?.id),
            householdId: Number(source?.householdId),
        }).unwrap();

        notifyLeftEvent(eventTitle);
        onClose();
    };

    return (
        <Modal
            title="Leave event confirmation"
            opened={opened}
            onClose={onClose}
            size="md"
            centered
        >
            <Text size="sm">
                Are you sure you want to leave the event <Text {...DIALOG_TITLE_PROPS}>{eventTitle}</Text>?
            </Text>
            {isOnlyAssignee && (
                <Text size="sm" c="gray.9" lh={1.2} mt=".5rem">
                    <strong>Note</strong>: Since you're the only person assigned to this event, leaving will permanently delete it.
                </Text>
            )}
            <Group justify="flex-end" w="100%" gap="0.5rem" mt="md">
                <ButtonStandard label="Cancel" variant="outline" onClick={onClose} />
                <ButtonStandard
                    label="Confirm"
                    color="red"
                    variant="filled"
                    onClick={handleUnassignSelf}
                />
            </Group>
        </Modal>
    );
};