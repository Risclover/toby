import {
    Group,
    Modal,
    NumberInput,
    Radio,
    Select,
    type ModalProps,
    type useModalsStack,
} from "@mantine/core";
import { DatePickerInput, type DateTimeStringValue } from "@mantine/dates";

import { ButtonStandard, ModalFooter } from "@/components";
import { EventFormRepeatEndsOption } from "./EventFormRepeatEndsOption";
import { EventFormRepeatWeekdays } from "./EventFormRepeatWeekdays";
import {
    ENDS_MODE,
    FREQ,
    useEventFormRepeatCustom,
} from "../../../hooks";
import type { ModalId } from "../../../types";
import { pluralizeUnit, type CustomRecurrenceRule } from "../../../utils";

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
const REPEAT_INPUT_WIDTH = 70;
const FREQ_SELECT_WIDTH = 120;
const ENDS_INPUT_WIDTH = 150;
const ENDS_DATE_FORMAT = "MMM D, YYYY";
const OCCURRENCE_UNIT = "occurrence";

const WHOLE_NUMBER_PROPS = {
    min: MIN_NUM_INPUT_VALUE,
    max: MAX_NUM_INPUT_VALUE,
    clampBehavior: "blur",
    allowNegative: false,
    allowDecimal: false,
} as const;

const MODAL_STYLES: ModalProps["styles"] = {
    body: {
        display: "flex",
        flexDirection: "column",
        height: "100%",
        padding: 0,
        overflow: "hidden",
    },
    content: {
        overflow: "hidden",
        maxHeight: "100%",
        display: "flex",
        flexDirection: "column",
    },
};

export const EventFormRepeatCustom = ({ stack, dateStr, onApply }: Props) => {
    const {
        freq,
        onFreqChange,
        selectedDays,
        onDaysChange,
        monthlyMode,
        onMonthlyModeChange,
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
    const occurrenceSuffix = ` ${pluralizeUnit(
        OCCURRENCE_UNIT,
        typeof afterOccurrences.value === "number" ? afterOccurrences.value : 0
    )}`;

    return (
        <Modal
            {...recurrenceStackProps}
            opened={recurrenceStackProps?.opened ?? false}
            title="Custom recurrence"
            onClose={handleCancel}
            centered
            size="sm"
            styles={MODAL_STYLES}
        >
            <div className="event-form-modal--body">
                <div className="event-form-repeat-custom--section">
                    <span className="event-form-repeat-custom--section-text">
                        Repeat every
                    </span>
                    <NumberInput
                        {...WHOLE_NUMBER_PROPS}
                        value={repeatEvery.value}
                        onChange={repeatEvery.onChange}
                        onBlur={repeatEvery.onBlur}
                        aria-label="Repeat every"
                        w={REPEAT_INPUT_WIDTH}
                    />
                    <Select
                        data={freqOptions}
                        value={freq}
                        onChange={onFreqChange}
                        w={FREQ_SELECT_WIDTH}
                        allowDeselect={false}
                    />
                </div>

                {freq === FREQ.WEEKLY && (
                    <EventFormRepeatWeekdays
                        selectedDays={selectedDays}
                        onDaysChange={onDaysChange}
                    />
                )}

                {freq === FREQ.MONTHLY && (
                    <Select
                        data={monthlyData}
                        value={monthlyMode}
                        onChange={onMonthlyModeChange}
                        allowDeselect={false}
                    />
                )}

                <div className="event-form-repeat-custom--vertical-section">
                    <span className="event-form-repeat-custom--section-text">Ends</span>
                    <div className="event-form-repeat-custom--radio-group">
                        <Radio.Group value={endsMode} onChange={setEndsMode}>
                            <Group mt="xs">
                                <EventFormRepeatEndsOption value={ENDS_MODE.NEVER} label="Never" />

                                <EventFormRepeatEndsOption value={ENDS_MODE.ON} label="On">
                                    <DatePickerInput
                                        disabled={endsMode !== ENDS_MODE.ON}
                                        value={endsOnDate}
                                        onChange={setEndsOnDate}
                                        minDate={dateStr}
                                        valueFormat={ENDS_DATE_FORMAT}
                                        w={ENDS_INPUT_WIDTH}
                                        aria-label="Ends on date"
                                    />
                                </EventFormRepeatEndsOption>

                                <EventFormRepeatEndsOption value={ENDS_MODE.AFTER} label="After">
                                    <NumberInput
                                        {...WHOLE_NUMBER_PROPS}
                                        suffix={occurrenceSuffix}
                                        value={afterOccurrences.value}
                                        onChange={afterOccurrences.onChange}
                                        onBlur={afterOccurrences.onBlur}
                                        disabled={endsMode !== ENDS_MODE.AFTER}
                                        w={ENDS_INPUT_WIDTH}
                                        aria-label="After"
                                    />
                                </EventFormRepeatEndsOption>
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