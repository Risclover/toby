import { Avatar, Badge, Modal, Stack } from "@mantine/core"
import { MembersModalAdminMenu } from "./MembersModalAdminMenu";
import { useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import { useAuthenticateQuery } from "@/store";
import { TransferAdminRoleConfirmation } from "./TransferAdminRoleConfirmation";
import { useDisclosure } from "@mantine/hooks";

export type HouseholdMember = {
    id: number;
    firstName: string;
    lastName: string;
    profileImg: string;
    adminId: number;
}

type Props = {
    opened: boolean;
    onOpen: () => void;
    onClose: () => void;
    household: {
        id: number;
        firstName: string;
        members: HouseholdMember[];
        adminId: number;
    }
}
export const MembersModal = ({ opened, onClose, household }: Props) => {
    const { data: currentUser } = useAuthenticateQuery();
    const navigate = useNavigate();

    return (
        <Modal size="sm" radius="md" centered opened={opened} onClose={onClose} title="Household Members">
            <Stack>
                {household?.members.map(member => <div className="members-modal-member" key={member.id}>
                    <div className="members-modal-member-left" onClick={() => navigate(`/profile/${member.id}`)}><Avatar size="sm" src={member.profileImg} />{member.firstName} {member.lastName} {member.id === household.members[0].id && <Badge size="xs" fw={600} color="rgb(5, 5, 73)" variant="light">Admin</Badge>}</div>
                    {currentUser.id === household.adminId && member.id !== household.adminId && <div className="members-modal-member-right"><MembersModalAdminMenu member={member} household={household} /></div>}
                </div>)}
            </Stack>
        </Modal>
    )
}