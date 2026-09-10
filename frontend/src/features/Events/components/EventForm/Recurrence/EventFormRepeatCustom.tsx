import { Button, Chip, Group, Modal, NumberInput, Radio, Select, Tooltip } from "@mantine/core";
import { DatePickerInput, type DateTimeStringValue } from "@mantine/dates";
import type { useModalsStack } from "@mantine/core";

import { WeekdayChip } from "./WeekdayChip";
import { useEventFormRepeatCustom, type Freq } from "../../../hooks/useEventFormRepeatCustom";
import { pluralizeUnit, WEEKDAY_ORDER, type CustomRecurrenceRule } from "../../../utils/recurrence";
import type { ModalId } from "../../../types";
import { ModalFooter } from "@/components/ModalFooter";
import { ButtonStandard } from "@/components/ButtonStandard";


type Props = {
    /** Modal stack */
    stack: ReturnType<typeof useModalsStack<ModalId>> | undefined;
    /** Selected date */
    dateStr: DateTimeStringValue;
    /** What happens when custom recurrence rule is applied */
    onApply: (rule: CustomRecurrenceRule) => void;
};

const MIN_NUM_INPUT_VALUE = 1;
const MAX_NUM_INPUT_VALUE = 9999;
const CHIP_TOOLTIP_DELAY_MS = 500;

const weekdayChips = WEEKDAY_ORDER.map((day) => ({
    value: day,
    label: day.charAt(0),
    tooltip: day,
}));

export const EventFormRepeatCustom = ({ stack, dateStr, onApply }: Props) => {
    const {
        freq,
        setFreq,
        selectedDays,
        onDaysChange,
        monthlyMode,
        setMonthlyMode,
        endsMode,
        setEndsMode,
        endsOnDate,
        setEndsOnDate,
        freqOptions,
        monthlyData,
        repeatEvery,
        afterOccurrences,
        handleSave,
        handleCancel,
    } = useEventFormRepeatCustom({ stack, dateStr, onApply });

    const recurrenceStackProps = stack?.register("recurrence");

    return (
        <Modal
            {...recurrenceStackProps}
            opened={recurrenceStackProps?.opened ?? false}
            title="Custom recurrence"
            onClose={handleCancel}
            centered
            size="sm"
            styles={{
                body: {
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    padding: 0,
                    overflow: "hidden"
                },
                content: {
                    overflow: "hidden",
                    maxHeight: "100%",
                    display: "flex",
                    flexDirection: "column"
                },
            }}
        >
            <div className="event-form-modal--body">
                <div className="event-form-repeat-custom--section">
                    <span className="event-form-repeat-custom--section-text">
                        Repeat every
                    </span>

                    {/** Input number of times to repeat */}
                    <NumberInput
                        value={repeatEvery.value}
                        onChange={repeatEvery.onChange}
                        onBlur={repeatEvery.onBlur}
                        min={MIN_NUM_INPUT_VALUE}
                        max={MAX_NUM_INPUT_VALUE}
                        clampBehavior="blur"
                        allowNegative={false}
                        allowDecimal={false}
                        aria-label="Repeat every"
                        w={70}
                    />

                    {/** Select frequency (daily, weekly, etc) */}
                    <Select
                        data={freqOptions}
                        value={freq}
                        onChange={(v) => setFreq(v as Freq | null)}
                        w={120}
                        allowDeselect={false}
                    />
                </div>

                {/** Weekly selected: offer weekday chips to toggle */}
                {freq === "WEEKLY" && (
                    <div className="event-form-repeat-custom--vertical-section">
                        <span className="event-form-repeat-custom--section-text">
                            Repeat on
                        </span>
                        <div className="event-form-repeat-custom--multiday">
                            <Chip.Group
                                multiple
                                value={selectedDays}
                                onChange={onDaysChange}
                            >
                                <Group
                                    justify="center"
                                    pt={8}
                                    gap=".25rem"
                                >
                                    <Tooltip.Group
                                        openDelay={CHIP_TOOLTIP_DELAY_MS}
                                        closeDelay={CHIP_TOOLTIP_DELAY_MS}
                                    >
                                        {weekdayChips.map((chip) => (
                                            <WeekdayChip
                                                key={chip.value}
                                                label={chip.label}
                                                value={chip.value}
                                                tooltip={chip.tooltip}
                                            />
                                        ))}
                                    </Tooltip.Group>
                                </Group>
                            </Chip.Group>
                        </div>
                    </div>
                )}

                {/** Monthly selected: offer monthly options */}
                {freq === "MONTHLY" && (
                    <Select
                        data={monthlyData}
                        value={monthlyMode}
                        onChange={(v) => setMonthlyMode(v as "day-of-month" | "nth-weekday" | null)}
                        allowDeselect={false}
                    />
                )}

                {/** Indicate when recurrence ends (never, on a specific date, or after x times) */}
                <div className="event-form-repeat-custom--vertical-section">
                    <span className="event-form-repeat-custom--section-text">Ends</span>
                    <div className="event-form-repeat-custom--radio-group">
                        <Radio.Group value={endsMode} onChange={setEndsMode}>
                            <Group mt="xs">
                                <Radio.Card
                                    value="never"
                                    key="never"
                                    className="radio-root"
                                >
                                    <div className="radio-root-label">
                                        <Radio.Indicator color="rgb(5, 5, 73)" />
                                        <span className="radio-label">Never</span>
                                    </div>
                                </Radio.Card>
                                <Radio.Card
                                    value="on"
                                    key="on"
                                    className="radio-root"
                                >
                                    <div className="radio-root-label">
                                        <Radio.Indicator color="rgb(5, 5, 73)" />
                                        <span className="radio-label">On</span>
                                    </div>
                                    <DatePickerInput
                                        disabled={endsMode !== "on"}
                                        value={endsOnDate}
                                        onChange={setEndsOnDate}
                                        minDate={dateStr}
                                        valueFormat="MMM D, YYYY"
                                        w={150}
                                        aria-label="Ends on date"
                                    />
                                </Radio.Card>
                                <Radio.Card
                                    value="after"
                                    key="after"
                                    className="radio-root"
                                >
                                    <div className="radio-root-label">
                                        <Radio.Indicator color="rgb(5, 5, 73)" />
                                        <span className="radio-label">After</span>
                                    </div>
                                    <NumberInput
                                        suffix={
                                            ` ${pluralizeUnit(
                                                "occurrence",
                                                typeof afterOccurrences.value === "number" ? afterOccurrences.value : 0
                                            )}`
                                        }
                                        w={150}
                                        value={afterOccurrences.value}
                                        onChange={afterOccurrences.onChange}
                                        onBlur={afterOccurrences.onBlur}
                                        disabled={endsMode !== "after"}
                                        min={MIN_NUM_INPUT_VALUE}
                                        max={MAX_NUM_INPUT_VALUE}
                                        clampBehavior="blur"
                                        allowNegative={false}
                                        allowDecimal={false}
                                        aria-label="After"
                                    />
                                </Radio.Card>
                            </Group>
                        </Radio.Group>
                    </div>
                </div>
            </div>

            <ModalFooter>
                <Group w="100%" justify="flex-end">
                    <ButtonStandard onClick={handleCancel} label="Cancel" variant="outline" />
                    <ButtonStandard onClick={handleSave} label="Save" variant="filled" />
                </Group>
            </ModalFooter>
        </Modal>
    );
};