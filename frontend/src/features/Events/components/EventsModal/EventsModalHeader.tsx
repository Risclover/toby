import { ActionIcon, Group, Stack, Text, Tooltip } from "@mantine/core";

import { EventsModalDateControls } from "./EventsModalDateControls";
import { EventsModalFilter } from "./EventsModalFilter";
import { TOOLTIP_EVENTS } from "../../utils";
import { PlusIcon } from "@/assets";

type Props = {
    /** Date chosen to view events */
    date: Date;
    /** Called when the selected date changes */
    onDateChange: (date: Date) => void;
    /** Called when the 'add event' button is clicked */
    onAddEvent: () => void;
    /** Selected filter option */
    filterValue: string | null;
    /** Called when the filter changes */
    onFilterChange: (value: string | null) => void;
};

const OPTIONS_GAP = 10;
const FILTER_LABEL_GAP = 4;
const FILTER_LABEL_SIZE = "12px";
const FILTER_LABEL_TOP_MARGIN = 4;
const PLUS_ICON_SIZE = "1.25rem";

/** Options for the events list modal: date picking, filter and 'add event'. */
export const EventsModalHeader = ({
    date,
    onDateChange,
    onAddEvent,
    filterValue,
    onFilterChange,
}: Props) => {
    const isFiltered = filterValue !== null;

    return (
        <div className="events-modal-header">
            <Stack gap={0}>
                <EventsModalDateControls date={date} onDateChange={onDateChange} />
                <Group
                    align="flex-end"
                    justify={isFiltered ? "space-between" : "flex-end"}
                    gap={OPTIONS_GAP}
                >
                    {isFiltered && (
                        <Group gap={FILTER_LABEL_GAP}>
                            <Text size={FILTER_LABEL_SIZE} c="black" fw={500} mt={FILTER_LABEL_TOP_MARGIN}>
                                Filter active:
                            </Text>
                            <Text size={FILTER_LABEL_SIZE} fw={400} mt={FILTER_LABEL_TOP_MARGIN}>
                                {` ${filterValue}`}
                            </Text>
                        </Group>
                    )}
                    <Group>
                        <EventsModalFilter
                            filterValue={filterValue}
                            onFilterChange={onFilterChange}
                        />
                        <Tooltip events={TOOLTIP_EVENTS} label="Add event" withArrow>
                            <ActionIcon
                                size="md"
                                onClick={onAddEvent}
                                variant="filled"
                                color="navy"
                                radius="sm"
                                fw={500}
                            >
                                <PlusIcon size={PLUS_ICON_SIZE} color="white" />
                            </ActionIcon>
                        </Tooltip>
                    </Group>
                </Group>
            </Stack>
        </div>
    );
};