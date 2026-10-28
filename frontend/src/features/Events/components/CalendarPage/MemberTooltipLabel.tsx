import { Avatar, Group, Text } from "@mantine/core";
import type { EventMember } from "../../utils";

type Props = {
    member: EventMember;
};

/** Tooltip content for a member dot: avatar, then full name. */
export const MemberTooltipLabel = ({ member }: Props) => (
    <Group gap={6} wrap="nowrap">
        <Avatar src={member.profileImg} size="xs" radius="xl" />
        <Text size="sm">{member.name}</Text>
    </Group>
);