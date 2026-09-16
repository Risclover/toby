import { useAuthenticateQuery, useUnassignSelfMutation } from "@/store";
import { Button, Group, Modal, Text } from "@mantine/core"
import type { Occurrence } from "../types";
import { KittyNotification } from "@/components";
import { KittyIcons } from "@/assets";
import { ButtonStandard } from "@/components/ButtonStandard";

type Props = {
    opened: boolean;
    onClose: () => void;
    occurrence: Occurrence;
}

export const UnassignSelfConfirmation = ({ opened, onClose, occurrence }: Props) => {
    const { data: currentUser } = useAuthenticateQuery();
    const [unassignSelf] = useUnassignSelfMutation();
    const onlyAssignedUser = occurrence.payload?.source.attendeeIds.length === 1 && occurrence.payload?.source.attendeeIds.includes(currentUser.id);
    const eventTitle = occurrence.payload?.source.title;

    const handleUnassignSelf = async () => {
        await unassignSelf({
            id: Number(occurrence.payload?.source.id),
            householdId: Number(occurrence.payload?.source.householdId)
        }).unwrap();

        KittyNotification({
            title: "Successfully left the event",
            message: <>You're way too cool to show up to "<strong style={{ fontWeight: 500 }} >{occurrence.payload?.source.title}</strong>". Let's do something else instead!</>,
            color: "green",
            icon: KittyIcons.Cellphone
        })
    }

    return (
        <Modal
            title="Leave event confirmation"
            opened={opened}
            onClose={onClose}
            size="md"
            centered
        >
            <Text size="sm">Are you sure you want to leave the event <strong style={{ fontWeight: 600 }}>{eventTitle}</strong>?</Text>
            {onlyAssignedUser && <Text size="sm" c="gray.9" lh={1.2} mt=".5rem"  ><strong>Note</strong>: Since you're the only person assigned to this event, leaving will permanently delete it.</Text>}
            <Group justify="flex-end" w="100%" gap="0.5rem" mt="md">
                <ButtonStandard
                    label="Cancel"
                    variant="outline"
                    onClick={onClose}
                />
                <ButtonStandard
                    label="Confirm"
                    color="red"
                    variant="filled"
                    onClick={handleUnassignSelf}
                />
            </Group>
        </Modal>
    )
}