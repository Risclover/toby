import { useAuthenticateQuery } from "@/store/authSlice"
import { useGetHouseholdQuery } from "@/store/householdSlice";
import { Avatar, Tooltip } from "@mantine/core"
import { Link } from "react-router-dom";

export const MobileHomeFamilyTitle = () => {
    const { data: user } = useAuthenticateQuery();
    const { data: household } = useGetHouseholdQuery(user?.householdId);

    const additionalMembers = household?.members.length - 3;
    return (
        <div className="mobile-home-family-title">
            {household?.name}

            <Avatar.Group spacing="xs">
                {household?.members.map(member => <Tooltip label={member.name} withArrow>
                    <Avatar component={Link} to={`/users/${member.id}`} target="_blank" src={member.profileImg} alt={member.name} radius="xl" size={26} />
                </Tooltip>).slice(0, 3)}
                {additionalMembers > 0 && <Avatar size={26}>+{additionalMembers}</Avatar>}
            </Avatar.Group>
        </div>
    )
}