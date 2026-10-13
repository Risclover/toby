import { Chip, Group, Tooltip } from "@mantine/core";

import { WeekdayChip } from "./WeekdayChip";
import { WEEKDAY_ORDER } from "../../../utils/recurrence";

type Props = {
    /** Currently selected weekdays */
    selectedDays: string[];
    /** Called with the full list of selected weekdays */
    onDaysChange: (values: string[]) => void;
};

const CHIP_TOOLTIP_DELAY_MS = 500;
const CHIP_GROUP_TOP_PADDING = 8;
const CHIP_GROUP_GAP = ".25rem";

const WEEKDAY_CHIPS = WEEKDAY_ORDER.map((day) => ({
    value: day,
    label: day.charAt(0),
    tooltip: day,
}));

export const EventFormRepeatWeekdays = ({ selectedDays, onDaysChange }: Props) => (
    <div className="event-form-repeat-custom--vertical-section">
        <span className="event-form-repeat-custom--section-text">Repeat on</span>
        <div className="event-form-repeat-custom--multiday">
            <Chip.Group multiple value={selectedDays} onChange={onDaysChange}>
                <Group justify="center" pt={CHIP_GROUP_TOP_PADDING} gap={CHIP_GROUP_GAP}>
                    <Tooltip.Group
                        openDelay={CHIP_TOOLTIP_DELAY_MS}
                        closeDelay={CHIP_TOOLTIP_DELAY_MS}
                    >
                        {WEEKDAY_CHIPS.map((chip) => (
                            <WeekdayChip key={chip.value} {...chip} />
                        ))}
                    </Tooltip.Group>
                </Group>
            </Chip.Group>
        </div>
    </div>
);