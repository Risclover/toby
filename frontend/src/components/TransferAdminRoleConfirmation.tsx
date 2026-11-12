import { Button, Group, Modal, Text } from "@mantine/core"
import type { HouseholdMember } from "./MembersModal";
import { useCreateAdminRequestMutation, type Household } from "@/store";
import { KittyNotification } from "./KittyNotification";
import { KittyIcons } from "@/assets";
import { ButtonStandard } from "./ButtonStandard";

export const TransferAdminRoleConfirmation = ({ opened, onClose, member, household }: { opened: boolean, onClose: () => void, member: HouseholdMember, household: Household }) => {
    const [createAdminRequest] = useCreateAdminRequestMutation();

    const handleRequest = async () => {
        try {
            await createAdminRequest({ householdId: household.id, userId: member.id }).unwrap();
            KittyNotification({
                title: "Request sent",
                message: <>We asked <strong style={{ fontWeight: 500 }}>{member.firstName} {member.lastName}</strong> to take over as household admin. You stay admin until they accept.</>,
                icon: KittyIcons.Bubbles,
                color: "gr"
            })
            onClose();
        } catch (error) {
            // 409 = a request is already pending, 400 = they're already the admin
            const status = (error as { status?: number }).status;
            KittyNotification({
                title: "Whoops - something went wrong",
                message: status === 409
                    ? "There's already a pending admin request. Cancel it first to ask someone else."
                    : "The request couldn't be sent. Please try again.",
                icon: KittyIcons.Rainy,
                color: "red"
            })

            console.error("Failed to send admin request:", error);
        }
    }

    return (
        <Modal closeOnClickOutside={false} centered radius="md" size="md" opened={opened} onClose={onClose} withCloseButton={false} title={`Ask to hand over the admin role`} onClick={(e) => e.stopPropagation()}>
            <Text c="black" size="sm">Ask <strong style={{ fontWeight: 500 }}>{member.firstName} {member.lastName}</strong> to become the household admin? They'll need to accept first, and you'll stay admin until they do. Once they accept, you will no longer be able to manage household members or content.</Text>
            <Group justify="flex-end" w="100%" gap="0.5rem" mt="1rem">
                <ButtonStandard
                    label="Cancel"
                    onClick={onClose}
                    color="var(--mantine-color-dark-6)"
                    variant="outline"
                />
                <ButtonStandard
                    label="Send request"
                    variant="filled"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleRequest();
                    }}
                    color="red.7"
                />
            </Group>
        </Modal>
    )
}