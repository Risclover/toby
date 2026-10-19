import { Avatar, Group, Text, Tooltip } from "@mantine/core";

import { formatFullName } from "@/utils/formatFullName";
import { useAttendeeDot } from "../../hooks/useAttendeeDot";
import type { DayEventRowSharedProps, MemberLike } from "../../types";
import { EVENT_ROW_TOOLTIP_PROPS } from "../../utils";
import { MemberDot } from "./MemberDot";

type Props = Pick<DayEventRowSharedProps, "openDotId" | "onOpenDot"> & {
    member: MemberLike;
    dotId: string;
};

const LABEL_GAP = 6;

export const AttendeeDot = ({ member, dotId, openDotId, onOpenDot }: Props) => {
    const { opened, setOpened } = useAttendeeDot({ dotId, openDotId, onOpenDot });
    const fullName = formatFullName(member);

    return (
        <Tooltip
            {...EVENT_ROW_TOOLTIP_PROPS}
            opened={opened}
            label={
                <Group gap={LABEL_GAP} wrap="nowrap">
                    <Avatar src={member.profileImg} size="xs" radius="xl" />
                    <Text size="sm">{fullName}</Text>
                </Group>
            }
        >
            <MemberDot
                color={member.color}
                name={fullName}
                opened={opened}
                setOpened={setOpened}
            />
        </Tooltip>
    );
};