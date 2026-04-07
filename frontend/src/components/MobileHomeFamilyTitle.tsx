import { useAuthenticateQuery, type User } from "@/store/authSlice"
import { useGetHouseholdQuery } from "@/store/householdSlice";
import { Avatar, Tooltip } from "@mantine/core"
import { useState } from "react";
import { Link } from "react-router-dom";
import { MembersModal } from "./MembersModal";
import { useHousehold } from "@/hooks/useHousehold";
import { useDisclosure } from "@mantine/hooks";

export const MobileHomeFamilyTitle = () => {
    const { data: household } = useHousehold();

    const [showMembersModal, setShowMembersModal] = useState(false);

    const additionalMembers = household?.members.length - 3;
    return (
        <div className="mobile-home-family-title">
            <h1>{household?.name}</h1>

            <Avatar.Group spacing="xs">
                {household?.members.map((member: User) => <Tooltip label={member.firstName} withArrow>
                    <Avatar component={Link} to={`/users/${member.id}`} target="_blank" src={member.profileImg} alt={member.firstName} radius="xl" size={30} />
                </Tooltip>).slice(0, 3)}
                {additionalMembers > 0 ? <Avatar className="clickable-avatar" onClick={() => setShowMembersModal(true)} size={30}>+{additionalMembers}</Avatar> : <Avatar className="clickable-avatar" onClick={() => setShowMembersModal(true)} size={30}>👀</Avatar>}
            </Avatar.Group>
            <MembersModal opened={showMembersModal} onOpen={() => setShowMembersModal(true)} onClose={() => setShowMembersModal(false)} household={household} />
        </div>
    )
}