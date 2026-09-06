import {
    ActionIcon,
    Button,
    CloseIcon,
    ComboboxPopover,
    Group,
    Indicator,
    Stack,
    Text,
    Tooltip
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";

import { useDayEvents } from "../../hooks/useDayEvents";

/** Icons */
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import FilterAltRoundedIcon from '@mui/icons-material/FilterAltRounded';
import TodayRoundedIcon from '@mui/icons-material/TodayRounded';
import { PlusIcon } from "@/assets";

type Props = {
    // Date chosen to view events 
    date: Date;
    // Function for when the selected date changes
    onDateChange: (date: Date) => void;
    // Function for when the 'add event' button is clicked
    onAddEvent: () => void;
    // Selected filter option 
    filterValue: string | null;
    // Function for when the filter changes 
    onFilterChange: (val: string | null) => void;
    householdId: number;
}

{/** Component containing options for the events list modal (date picking, filter, etc) */ }
export const EventsModalHeader = ({
    date,
    onDateChange,
    onAddEvent,
    filterValue,
    onFilterChange,
    householdId
}: Props) => {
    const {
        isSmallScreen,
        handleDateChange,
        goToPreviousDay,
        goToNextDay
    } = useDayEvents({ householdId, date, onDateChange });

    return (
        <div className="events-modal-header">
            <Stack gap={0}>
                {/** Top options (date picking) */}
                <Group align="center" justify="space-between" gap={0}>
                    <Group align="center" gap="xs">
                        <Tooltip label="Jump to today" withArrow>
                            {!isSmallScreen
                                ? <Button
                                    radius="sm"
                                    onClick={() => onDateChange(new Date())}
                                    size="sm"
                                    color="rgb(5, 5, 73)"
                                    variant="filled"
                                    p=".5rem 1rem"
                                    h="auto"
                                    fw={500}
                                >
                                    Today
                                </Button>
                                : <ActionIcon
                                    onClick={() => onDateChange(new Date())}
                                    variant="subtle"
                                    color="rgb(5, 5, 73)"
                                    radius="sm"
                                >
                                    <TodayRoundedIcon />
                                </ActionIcon>
                            }
                        </Tooltip>
                        <div className="events-modal-next-prev">
                            <Tooltip withArrow label="Previous date">
                                <ActionIcon
                                    onClick={goToPreviousDay}
                                    variant="filled"
                                    radius="sm"
                                    color="rgb(5, 5, 73)"
                                >
                                    <ChevronLeftRoundedIcon />
                                </ActionIcon>
                            </Tooltip>
                            <Tooltip withArrow label="Next date">
                                <ActionIcon
                                    onClick={goToNextDay}
                                    variant="filled"
                                    radius="sm"
                                    color="rgb(5, 5, 73)"
                                >
                                    <ChevronRightRoundedIcon />
                                </ActionIcon>
                            </Tooltip>
                        </div>
                        <DatePickerInput
                            placeholder="Pick date"
                            value={date}
                            onChange={handleDateChange}
                            clearable={false}
                            rightSection={
                                <div className="expand-events-date-picker">
                                    <ExpandMoreRoundedIcon />
                                </div>
                            }
                            rightSectionPointerEvents="none"
                            dropdownType={isSmallScreen ? "modal" : "popover"}
                            styles={{
                                input: {
                                    border: 0
                                }
                            }}
                        />
                    </Group>
                </Group>
                {/** Bottom options (filter + 'add event' button) */}
                <Group align="flex-end" justify="space-between" gap={10}>
                    <Group justify="flex-start" gap={0}>
                        {filterValue !== null &&
                            <>
                                <Text size="12px" c="black" fw={500} mt={4}>Filter active:</Text>
                                <Text size="12px" fw={400} mt={4}>{` ${filterValue}`}</Text>
                            </>
                        }
                    </Group>
                    <Group>
                        <Group gap={1} align="center">
                            <ComboboxPopover
                                data={["Mine only", "Group by user"]}
                                value={filterValue}
                                onChange={onFilterChange}
                                styles={{
                                    dropdown: {
                                        minWidth: 150,
                                        maxWidth: "calc(100vw - 1rem)"
                                    }
                                }}
                            >
                                <ComboboxPopover.Target>
                                    <Indicator
                                        styles={{
                                            root: {
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center"
                                            }
                                        }}
                                        h="auto"
                                        disabled={!filterValue}
                                        size={7}
                                        color="blue"
                                        offset={4}
                                        zIndex={2}
                                    >
                                        <Tooltip
                                            events={{ hover: true, focus: true, touch: true }}
                                            withArrow
                                            label="Filter options"
                                        >
                                            <ActionIcon
                                                variant="subtle"
                                                color="rgb(5, 5, 73)"
                                                size="md"
                                                radius="sm"
                                            >
                                                <FilterAltRoundedIcon />
                                            </ActionIcon>
                                        </Tooltip>
                                    </Indicator>
                                </ComboboxPopover.Target>
                            </ComboboxPopover>
                            {/** Clear filter button */}
                            {filterValue && (
                                <Tooltip
                                    events={{ hover: true, focus: true, touch: true }}
                                    label="Clear filter"
                                    withArrow
                                >
                                    <ActionIcon
                                        variant="subtle"
                                        color="rgb(5, 5, 73)"
                                        size="sm"
                                        radius="sm"
                                        p={0}
                                        w={0}
                                        onClick={() => onFilterChange(null)}
                                        aria-label="Clear filter"
                                    >
                                        <CloseIcon />
                                    </ActionIcon>
                                </Tooltip>
                            )}
                        </Group>
                        <Tooltip
                            events={{ hover: true, focus: true, touch: true }}
                            label="Add event"
                            withArrow
                        >
                            <ActionIcon
                                size="md"
                                onClick={onAddEvent}
                                variant="filled"
                                color="rgb(5, 5, 73)"
                                radius="sm"
                                fw={500}
                            >
                                <PlusIcon size="1.25rem" color="white" />
                            </ActionIcon>
                        </Tooltip>
                    </Group>
                </Group>
            </Stack>
        </div>
    )
}
