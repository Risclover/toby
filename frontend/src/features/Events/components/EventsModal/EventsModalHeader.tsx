import { ActionIcon, Button, Checkbox, CheckIcon, CloseIcon, Combobox, ComboboxPopover, Group, Indicator, Radio, Select, Stack, Switch, Tooltip, useCombobox } from "@mantine/core";
import { DatePickerInput, type DateTimeStringValue } from "@mantine/dates";
import dayjs from "dayjs";
import { useState, type SetStateAction } from "react";
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import { useIsSmallScreen } from "@/hooks";
import FilterAltRoundedIcon from '@mui/icons-material/FilterAltRounded';
import TodayRoundedIcon from '@mui/icons-material/TodayRounded';


type Props = {
    date: Date;
    onDateChange: (date: Date) => void;
    onAddEvent: () => void;
    filterValue: string | null;
    onFilterChange: (val: string | null) => void;
}

const PlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);


export const EventsModalHeader = ({ date, onDateChange, onAddEvent, filterValue, onFilterChange }: Props) => {
    const isSmallScreen = useIsSmallScreen(475);
    const handleDateChange = (value: string | null) => {
        if (!value) return; // clearing isn't meaningful here -- there's always a day being viewed
        onDateChange(dayjs(value).toDate());
    };

    const combobox = useCombobox({
        onDropdownClose: () => combobox.resetSelectedOption(),
    });

    const goToPreviousDay = () => onDateChange(dayjs(date).subtract(1, 'day').toDate());
    const goToNextDay = () => onDateChange(dayjs(date).add(1, 'day').toDate());

    return (
        <div className="events-modal-header" style={{ position: "sticky", top: 60, zIndex: 1, background: "var(--mantine-color-body)" }}>
            {/** 
             * OPTIONS:
             * - date: (shows the date clicked on; can be changed to another date)
             * - "my events only" switch toggle
             * - group by household member (each member's name is a header, with their events listed below)
             * - "Today" button (jumps to today's date; refreshes the list if already on today's date?)
            */}
            <Stack gap={0}>
                <Group align="center" justify="space-between" gap={0}>
                    <Group align="center" gap="xs">
                        <Tooltip label="Jump to today" withArrow>
                            {!isSmallScreen
                                ?
                                <Button radius="sm" onClick={() => onDateChange(new Date())} size="sm" color="rgb(5, 5, 73)" variant="filled" p=".5rem 1rem" h="auto" fw={500}>
                                    Today
                                </Button>
                                :
                                <ActionIcon onClick={() => onDateChange(new Date())} variant="subtle" color="rgb(5, 5, 73)" radius="sm">
                                    <TodayRoundedIcon />
                                </ActionIcon>
                            }
                        </Tooltip>
                        <div className="events-modal-next-prev">
                            <Tooltip withArrow label="Previous date">
                                <ActionIcon onClick={goToPreviousDay} variant="filled" radius="sm" color="rgb(5, 5, 73)">
                                    <ChevronLeftRoundedIcon />
                                </ActionIcon>
                            </Tooltip>
                            <Tooltip withArrow label="Next date">
                                <ActionIcon onClick={goToNextDay} variant="filled" radius="sm" color="rgb(5, 5, 73)">
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
                <Group justify="flex-end" gap={10}>
                    <Group gap={1} align="center">
                        <ComboboxPopover
                            data={["Mine only", "Group by user"]}
                            value={filterValue}
                            onChange={onFilterChange}
                            styles={{
                                dropdown: {
                                    minWidth: 150,
                                    maxWidth: "calc(100vw - 1rem)" // hard ceiling so it can never claim more than the viewport actually has
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
                                    <Tooltip events={{ hover: true, focus: true, touch: true }} withArrow label="Filter options">
                                        <ActionIcon variant="subtle" color="rgb(5, 5, 73)" size="md" radius="sm">
                                            <FilterAltRoundedIcon />
                                        </ActionIcon>
                                    </Tooltip>
                                </Indicator>
                            </ComboboxPopover.Target>
                        </ComboboxPopover>
                        {filterValue && (
                            <Tooltip events={{ hover: true, focus: true, touch: true }} label="Clear filter" withArrow>
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
                    <Tooltip events={{ hover: true, focus: true, touch: true }} label="Add event" withArrow>
                        <ActionIcon size="md" onClick={onAddEvent} variant="filled" color="rgb(5, 5, 73)" radius="sm" fw={500}>
                            <PlusIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                        </ActionIcon>
                    </Tooltip>
                </Group>
            </Stack>
        </div>
    )
}
