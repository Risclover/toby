import { ActionIcon, Group, Stack, Text, Tooltip } from "@mantine/core";

import { EventsModalDateControls } from "./EventsModalDateControls";
import { EventsModalFilter } from "./EventsModalFilter";
import { TOOLTIP_EVENTS } from "../../utils";
import { PlusIcon } from "@/assets";
import { useEventsModalDateControls } from "../..";
import { DatePickerInput } from "@mantine/dates";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";

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
const PLUS_ICON_SIZE = "1.25rem";
const DATE_INPUT_STYLES = { input: { border: 0 } };

const DATE_INPUT_CHEVRON = (
    <div className="expand-events-date-picker">
        <ExpandMoreRoundedIcon />
    </div>
);
/** Options for the events list modal: date picking, filter and 'add event'. */
export const EventsModalHeader = ({
    date,
    onDateChange,
    onAddEvent,
    filterValue,
    onFilterChange,
}: Props) => {
    const isFiltered = filterValue !== null;
    const {
        isSmallScreen,
        handleDateChange,
    } = useEventsModalDateControls({ date, onDateChange });
    return (
        <div className="events-modal-header">
            <Stack gap={4}>
                <EventsModalDateControls
                    date={date}
                    onDateChange={onDateChange}
                    isFiltered={isFiltered}
                    filterValue={filterValue}
                />
                <Group
                    align="flex-end"
                    justify="space-between"
                    gap={OPTIONS_GAP}
                >
                    <DatePickerInput
                        placeholder="Pick date"
                        value={date}
                        onChange={handleDateChange}
                        clearable={false}
                        rightSection={DATE_INPUT_CHEVRON}
                        rightSectionPointerEvents="none"
                        dropdownType={isSmallScreen ? "modal" : "popover"}
                        styles={DATE_INPUT_STYLES}
                    />
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