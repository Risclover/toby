import { Avatar, Modal, Stack } from "@mantine/core"

type HouseholdMember = {
    id: number;
    name: string;
    profileImg: string;
}
type Props = {
    opened: boolean;
    onClose: () => void;
    household: {
        id: number;
        members: HouseholdMember[];
    }
}
export const MembersModal = ({ opened, onClose, household }: Props) => {
    return (
        <Modal size="xs" centered opened={opened} onClose={onClose} title="Household Members">
            <Stack>
                {household?.members.map(member => <div className="members-modal-member">
                    <Avatar size="sm" src={member.profileImg} />{member.firstName}
                </div>)}
            </Stack>
        </Modal>
    )
}