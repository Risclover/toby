import { useId } from "react";
import { Collapse, Group, Text, UnstyledButton, type BoxProps } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { formatDayLabel } from "../../utils";
import { AgendaList } from "../AgendaList";
import type { UpcomingDay } from "../..";

const DAY_AGENDA_STYLES = {
    // We render our own date header (it's the collapse toggle), so hide AgendaView's.
    agendaViewHeader: { display: "none" },
    agendaViewDateHeader: { display: "none" },
    // Let each day grow with its events; the whole homepage list scrolls instead.
    // The section card clips the corners, so no overflow clipping is needed here.
    agendaViewBody: { maxHeight: "none", overflow: "visible", background: "#fff" },
};

type Props = {
    day: UpcomingDay;
    rowProps?: BoxProps;
};

/** One day of the upcoming list: a collapsible date header over that day's agenda rows. */
export const UpcomingDaySection = ({ day, rowProps }: Props) => {
    const [opened, { toggle }] = useDisclosure(true);
    const panelId = useId();
    const eventCount = day.events.length;

    return (
        <div className="upcoming-event-section">
            <UnstyledButton
                className="upcoming-event-section-header"
                onClick={toggle}
                aria-expanded={opened}
                aria-controls={panelId}
                w="100%"
                px={12}
                py={8}
            >
                <Group justify="space-between" wrap="nowrap">
                    <div className="events-settings-section-title events-section-title">{formatDayLabel(day.ymd)}</div>
                    <Group gap={6} wrap="nowrap">
                        {!opened && (
                            <Text fz="xs" c="dimmed">
                                {eventCount} {eventCount === 1 ? "event" : "events"}
                            </Text>
                        )}
                        <ExpandMoreRoundedIcon
                            fontSize="small"
                            style={{
                                transform: opened ? undefined : "rotate(-90deg)",
                                transition: "transform 150ms ease",
                            }}
                        />
                    </Group>
                </Group>
            </UnstyledButton>
            <Collapse expanded={opened} id={panelId}>
                <AgendaList
                    range={{ start: day.ymd, end: day.ymd }}
                    events={day.events}
                    styles={DAY_AGENDA_STYLES}
                    rowProps={rowProps}
                />
            </Collapse>
        </div>
    );
};