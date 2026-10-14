import { ActionIcon, Group, Tooltip } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";

import { useEventsModalDateControls } from "../../hooks/useEventsModalDateControls";
import { EventsModalTodayButton } from "./EventsModalTodayButton";

type Props = {
    /** Date chosen to view events */
    date: Date;
    /** Called when the selected date changes */
    onDateChange: (date: Date) => void;
};

const DATE_INPUT_STYLES = { input: { border: 0 } };

const DATE_INPUT_CHEVRON = (
    <div className="expand-events-date-picker">
        <ExpandMoreRoundedIcon />
    </div>
);

export const EventsModalDateControls = ({ date, onDateChange }: Props) => {
    const {
        isSmallScreen,
        goToToday,
        goToPreviousDay,
        goToNextDay,
        handleDateChange,
    } = useEventsModalDateControls({ date, onDateChange });

    const dayNavButtons = [
        { label: "Previous date", icon: <ChevronLeftRoundedIcon />, onClick: goToPreviousDay },
        { label: "Next date", icon: <ChevronRightRoundedIcon />, onClick: goToNextDay },
    ];

    return (
        <Group align="center" gap="xs">
            <EventsModalTodayButton isSmallScreen={isSmallScreen} onClick={goToToday} />
            <div className="events-modal-next-prev">
                {dayNavButtons.map(({ label, icon, onClick }) => (
                    <Tooltip key={label} withArrow label={label}>
                        <ActionIcon onClick={onClick} variant="filled" radius="sm" color="navy">
                            {icon}
                        </ActionIcon>
                    </Tooltip>
                ))}
            </div>
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
        </Group>
    );
};