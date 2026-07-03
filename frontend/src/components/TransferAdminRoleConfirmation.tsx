import { Button, Group, Modal, Text } from "@mantine/core"
import type { HouseholdMember } from "./MembersModal";
import { useTransferAdminRoleMutation, type Household } from "@/store";
import { KittyNotification } from "./KittyNotification";
import { KittyIcons } from "@/assets";

export const TransferAdminRoleConfirmation = ({ opened, onClose, member, household }: { opened: boolean, onClose: () => void, member: HouseholdMember, household: Household }) => {
    const [transferAdminRole] = useTransferAdminRoleMutation();

    const handleTransferAdminRole = async () => {
        try {
            await transferAdminRole({ householdId: household.id, userId: member.id }).unwrap();
            KittyNotification({
                title: "Admin role transferred",
                message: <><strong style={{ fontWeight: 500 }}>{member.firstName} {member.lastName}</strong> is the new household admin. Long live the new king/queen! 👑</>,
                icon: KittyIcons.Bubbles,
                color: "gr"
            })
        } catch (error) {
            KittyNotification({
                title: "Whoops - something went wrong",
                message: "Admin role couldn't be transferred. Please try again.",
                icon: KittyIcons.Rainy,
                color: "red"
            })

            console.error("Failed to transfer admin role:", error);
        }
    }

    return (
        <Modal closeOnClickOutside={false} centered radius="md" size="md" opened={opened} onClose={onClose} withCloseButton={false} title={`Confirm admin role transfer`} onClick={(e) => e.stopPropagation()}>
            <Text c="black" size="sm">Are you sure you want to hand the keys over to <strong style={{ fontWeight: 500 }}>{member.firstName} {member.lastName}</strong>? You will no longer be able to manage household members or content.</Text>
            <Group justify="flex-end" w="100%" gap="0.5rem" mt="1rem">
                <Button
                    className="tasklist-settings-footer-btn"
                    size="compact-sm"
                    onClick={onClose}
                    color="var(--mantine-color-dark-6)"
                    variant="outline"
                >
                    Cancel
                </Button>
                <Button
                    className="tasklist-settings-footer-btn"
                    size="compact-sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleTransferAdminRole();
                    }}
                    color="red.7"
                >
                    Confirm
                </Button>
            </Group>
        </Modal>
    )
}