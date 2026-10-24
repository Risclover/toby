import { ActionIcon, Group, Text, Tooltip } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";

import { EventsModalTodayButton } from "./EventsModalTodayButton";
import { useEventsModalDateControls } from "../../hooks";

type Props = {
    /** Date chosen to view events */
    date: Date;
    /** Called when the selected date changes */
    onDateChange: (date: Date) => void;
    isFiltered: boolean;
    filterValue: string | null;
};

const FILTER_LABEL_GAP = 4;
const FILTER_LABEL_SIZE = "12px";
const FILTER_LABEL_TOP_MARGIN = 4;

export const EventsModalDateControls = ({ date, onDateChange, isFiltered, filterValue }: Props) => {
    const {
        isSmallScreen,
        goToToday,
        goToPreviousDay,
        goToNextDay,
    } = useEventsModalDateControls({ date, onDateChange });

    const dayNavButtons = [
        { label: "Previous date", icon: <ChevronLeftRoundedIcon />, onClick: goToPreviousDay },
        { label: "Next date", icon: <ChevronRightRoundedIcon />, onClick: goToNextDay },
    ];

    return (
        <Group align="flex-end" gap={8} justify="space-between">
            <Group gap={8}>
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
            </Group>
            {isFiltered && (
                <Group gap={FILTER_LABEL_GAP} >
                    <Text size={FILTER_LABEL_SIZE} c="black" fw={500} mt={FILTER_LABEL_TOP_MARGIN}>
                        Filter active:
                    </Text>
                    <Text size={FILTER_LABEL_SIZE} fw={400} mt={FILTER_LABEL_TOP_MARGIN}>
                        {` ${filterValue}`}
                    </Text>
                </Group>
            )}
        </Group>
    );
};