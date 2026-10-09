import { ActionIcon, Group } from "@mantine/core";
import { MonthPickerInput } from "@mantine/dates";
import { ButtonStandard } from "@/components/ButtonStandard";
import type { useCalendarMobileMonthView } from "../../hooks/useCalendarMobileMonthView";


const SPACER_STYLE = { flex: 1 };
const TODAY_SLOT_STYLE = { flex: 1, display: "flex", justifyContent: "flex-end" };
const MONTH_PICKER_STYLES = {
    input: { border: 0, textAlign: "center", fontSize: 16, fontWeight: 500 },
} as const;

type MobileMonthHeaderProps = {
    date: string;
    navigation: ReturnType<typeof useCalendarMobileMonthView>["navigation"];
};

export const MobileMonthHeader = ({ date, navigation }: MobileMonthHeaderProps) => {
    const { stepMonth, selectMonth, goToCurrentMonth } = navigation;

    const handlePrevious = () => stepMonth(-1);
    const handleNext = () => stepMonth(1);

    return (
        // Equal flex weight on both outer slots keeps the arrows and picker truly centered, Today pinned right.
        <Group justify="space-between" mb="xs" wrap="nowrap" gap={4}>
            <div style={SPACER_STYLE} />
            <Group gap={12} wrap="nowrap">
                <ActionIcon
                    radius="sm"
                    variant="transparent"
                    onClick={handlePrevious}
                    aria-label="Previous month"
                >
                    ‹
                </ActionIcon>
                <MonthPickerInput
                    placeholder="Pick month"
                    value={date}
                    onChange={selectMonth}
                    clearable={false}
                    dropdownType="modal"
                    styles={MONTH_PICKER_STYLES}
                />
                <ActionIcon
                    radius="sm"
                    variant="transparent"
                    onClick={handleNext}
                    aria-label="Next month"
                >
                    ›
                </ActionIcon>
            </Group>
            <div style={TODAY_SLOT_STYLE}>
                <ButtonStandard variant="subtle" onClick={goToCurrentMonth} label="Today" />
            </div>
        </Group>
    );
};