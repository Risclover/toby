import { Button, Group, Modal, Text } from "@mantine/core";
import type { HouseholdMember } from "./MembersModal";
import { useRemoveHouseholdMemberMutation, type Household } from "@/store";
import { ButtonStandard } from "./ButtonStandard";

export const RemoveMemberConfirmation = ({ opened, onClose, member, household }: { opened: boolean; onClose: () => void; member: HouseholdMember; household: Household }) => {
    const [removeMember] = useRemoveHouseholdMemberMutation();

    const handleRemoval = async () => {
        await removeMember({ householdId: household.id, userId: member.id }).unwrap();
        onClose();
    }

    return (
        <Modal closeOnClickOutside={false} centered radius="md" size="md" opened={opened} onClose={onClose} withCloseButton={false} title={`Remove ${member.firstName} from ${household.name}?`} onClick={(e) => e.stopPropagation()}>
            <Text c="black" size="sm">Giving <strong style={{ fontWeight: 500 }}>{member.firstName} {member.lastName}</strong> the boot? They'll lose access to all household content and won't be able to rejoin without an invite. Make sure you mean it!</Text>
            <Group justify="flex-end" w="100%" gap="0.5rem" mt="1rem">
                <ButtonStandard
                    onClick={onClose}
                    color="var(--mantine-color-dark-6)"
                    variant="outline"
                    label="Cancel"
                />
                <ButtonStandard
                    onClick={handleRemoval}
                    color="red.7"
                    label="Confirm"
                    variant="filled"
                />
            </Group>
        </Modal>
    )
}