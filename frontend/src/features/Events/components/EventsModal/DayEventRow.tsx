import { Group, Stack, Text, Tooltip } from "@mantine/core";

import { EventActionsMenu } from "../CalendarPage";
import { AttendeeDot } from "./AttendeeDot";
import { useDayEventRow } from "../../hooks";
import { EVENT_ROW_TOOLTIP_PROPS } from "../../utils";
import type { DayEventRowSharedProps, Occurrence } from "../../types";

type Props = DayEventRowSharedProps & {
    occurrence: Occurrence;
    groupOwnerId?: number;
};

const FLAT_GROUP_ID = "flat";
const ROW_GAP = 4;
const HEADER_GAP = ".25rem";
const TITLE_DOTS_GAP = 8;
const DOTS_GAP = 3;
const TITLE_SIZE = "15px";
const TIME_SIZE = "13px";
const TITLE_TOOLTIP_MAX_WIDTH = "95%";

export const DayEventRow = ({
    occurrence,
    onEdit,
    openDotId,
    onOpenDot,
    groupOwnerId,
}: Props) => {
    const { titleRef, isTruncated, source, timeLabel, attendees } = useDayEventRow({ occurrence });

    // Edit still seeds from the series master, as before.
    const handleEdit = () => onEdit(source);

    return (
        <div className="event-row">
            <Stack gap={ROW_GAP}>
                <Group
                    gap={HEADER_GAP}
                    miw={0}
                    wrap="nowrap"
                    justify="space-between"
                    w="100%"
                >
                    <Group gap={TITLE_DOTS_GAP} miw={0} wrap="nowrap">
                        <Tooltip
                            {...EVENT_ROW_TOOLTIP_PROPS}
                            maw={TITLE_TOOLTIP_MAX_WIDTH}
                            label={occurrence.title}
                            disabled={!isTruncated}
                            multiline
                        >
                            <Text
                                ref={titleRef}
                                size={TITLE_SIZE}
                                inline
                                c="black"
                                fw={500}
                                truncate
                                miw={0}
                            >
                                {occurrence.title}
                            </Text>
                        </Tooltip>
                        <Group gap={DOTS_GAP} wrap="nowrap" flex="none">
                            {attendees.map((member) => (
                                <AttendeeDot
                                    key={member.id}
                                    member={member}
                                    dotId={`${groupOwnerId ?? FLAT_GROUP_ID}-${occurrence.id}-${member.id}`}
                                    openDotId={openDotId}
                                    onOpenDot={onOpenDot}
                                />
                            ))}
                        </Group>
                    </Group>
                    <EventActionsMenu occurrence={occurrence} onEdit={handleEdit} />
                </Group>
                <Text size={TIME_SIZE} inline fw={400} c="dimmed">
                    {timeLabel}
                </Text>
            </Stack>
        </div>
    );
};