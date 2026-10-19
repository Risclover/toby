import { ActionIcon, Avatar, Group, Stack } from "@mantine/core";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";

import { DayEventRow } from "./DayEventRow";
import { useMemberEventSection } from "../../hooks";
import { formatFullName } from "@/utils";
import type { DayEventRowSharedProps, MemberLike, Occurrence } from "../../types";

type Props = {
    member: MemberLike;
    events: Occurrence[];
    isCurrentUser: boolean;
    rowProps: DayEventRowSharedProps;
};

const SECTION_GAP = 4;
const HEADER_GAP = 8;
const HEADER_PADDING = ".75rem";
const HEADER_BACKGROUND = "var(--mantine-color-gray-1";
const HEADER_STYLES = { root: { borderRadius: ".5rem" } };
const TITLE_STYLE = { marginBottom: 0, fontSize: "13px" };
const AVATAR_SIZE = 24;
const CURRENT_USER_SUFFIX = " (You)";

const ICON_TRANSITION = "transform 150ms ease";
const ICON_STYLE_EXPANDED = { transform: "rotate(180deg)", transition: ICON_TRANSITION };
const ICON_STYLE_COLLAPSED = { transform: "rotate(0deg)", transition: ICON_TRANSITION };

export const MemberEventSection = ({ member, events, isCurrentUser, rowProps }: Props) => {
    const { isCollapsed, handleToggle } = useMemberEventSection();
    const fullName = formatFullName(member);

    return (
        <Stack gap={SECTION_GAP} mb="sm" p="0 .5rem">
            <div className="member-event-section-header" onClick={handleToggle}>
                <Group
                    gap={HEADER_GAP}
                    bg={HEADER_BACKGROUND}
                    fw={500}
                    p={HEADER_PADDING}
                    wrap="nowrap"
                    align="center"
                    styles={HEADER_STYLES}
                >
                    <Avatar src={member.profileImg} size={AVATAR_SIZE} radius="xl" />
                    <div className="events-settings-section-title" style={TITLE_STYLE}>
                        {fullName}
                        {isCurrentUser ? CURRENT_USER_SUFFIX : ""}
                    </div>
                    <ActionIcon
                        variant="transparent"
                        color="black"
                        size="sm"
                        radius="sm"
                        onClick={handleToggle}
                        aria-label={`${isCollapsed ? "Expand" : "Collapse"} ${fullName}`}
                        aria-expanded={!isCollapsed}
                    >
                        <ExpandMoreRoundedIcon
                            fontSize="small"
                            style={isCollapsed ? ICON_STYLE_COLLAPSED : ICON_STYLE_EXPANDED}
                        />
                    </ActionIcon>
                </Group>
            </div>
            {!isCollapsed &&
                events.map((occurrence) => (
                    <DayEventRow
                        key={String(occurrence.id)}
                        occurrence={occurrence}
                        groupOwnerId={member.id}
                        {...rowProps}
                    />
                ))}
        </Stack>
    );
};