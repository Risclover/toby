import { ActionIcon, Avatar, Group, Stack, Text } from "@mantine/core";
import { useState } from "react";
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import { formatFullName } from "@/utils/formatFullName";
import { DayEventRow } from "./DayEventRow";
import { type DayEventRowSharedProps, type MemberLike, type Occurrence, type UserGroup } from "../../types";

const MemberEventSection = ({
    member,
    events,
    isCurrentUser,
    rowProps,
}: {
    member: MemberLike;
    events: Occurrence[];
    isCurrentUser: boolean;
    rowProps: DayEventRowSharedProps;
}) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <Stack gap={4} mb="sm" p="0 .5rem">
            <Group gap={8} bg="var(--mantine-color-gray-1" fw={500} p="1rem" wrap="nowrap" align="center">
                <Avatar src={member.profileImg} size={24} radius="xl" />
                <div className="settings-section-title" style={{ marginBottom: 0, fontSize: "13px" }}>
                    {formatFullName(member)}{isCurrentUser ? " (You)" : ""}
                </div>
                <ActionIcon
                    variant="transparent"
                    color="black"
                    size="sm"
                    radius="sm"
                    onClick={() => setIsCollapsed((prev) => !prev)}
                    aria-label={isCollapsed ? `Expand ${formatFullName(member)}` : `Collapse ${formatFullName(member)}`}
                    aria-expanded={!isCollapsed}
                >
                    <ExpandMoreRoundedIcon
                        fontSize="small"
                        style={{ transform: isCollapsed ? "rotate(0deg)" : "rotate(180deg)", transition: "transform 150ms ease" }}
                    />
                </ActionIcon>
            </Group>
            {!isCollapsed && events.map((occ) => (
                <DayEventRow key={String(occ.id)} occurrence={occ} {...rowProps} />
            ))}
        </Stack>
    );
};

export const MemberEventGroups = ({
    groups,
    currentUserId,
    rowProps,
}: {
    groups: UserGroup[];
    currentUserId?: number;
    rowProps: DayEventRowSharedProps;
}) => {
    if (groups.length === 0) {
        return <Text c="dimmed" size="sm">No events for this date.</Text>;
    }

    return (
        <>
            {groups.map(({ member, events }) => (
                <MemberEventSection key={member.id} member={member} events={events} isCurrentUser={member.id === currentUserId} rowProps={rowProps} />
            ))}
        </>
    );
};