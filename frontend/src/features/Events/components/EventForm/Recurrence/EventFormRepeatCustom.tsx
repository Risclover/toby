import { Button, Chip, Group, Modal, NumberInput, Radio, Select, Tooltip, useModalsStack } from "@mantine/core"
import { DateInput, type DateTimeStringValue } from "@mantine/dates";
import dayjs from "dayjs";
import { useEffect, useMemo, useRef, useState } from "react";
import { nthWeekdaySuffix, WEEKDAY_ORDER, type CustomRecurrenceRule, type RecurrenceEnd } from "../../../utils/recurrence";
import { WeekdayChip } from "./WeekdayChip";

type ModalId = 'recurrence' | 'event-form' | 'events-list';
type EndsMode = 'never' | 'on' | 'after';
type Freq = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

type Props = {
    stack: ReturnType<typeof useModalsStack<ModalId>> | undefined;
    dateStr: DateTimeStringValue;
    // Called when the modal closes, with whatever rule is currently
    // configured -- replaces setCustomOption. Hands up a structured rule
    // instead of a rendered string, so the parent has real data to build
    // an RRULE from later instead of English text to re-parse.
    onApply: (rule: CustomRecurrenceRule) => void;
}

const FREQ_UNITS = [
    { value: 'DAILY', label: 'day' },
    { value: 'WEEKLY', label: 'week' },
    { value: 'MONTHLY', label: 'month' },
    { value: 'YEARLY', label: 'year' },
];

const DEFAULT_INTERVAL = 1;
const DEFAULT_OCCURRENCES = 5;
const DEFAULT_FREQ: Freq = 'WEEKLY';
const DEFAULT_MONTHLY_MODE = 'nth-weekday' as const;
const DEFAULT_ENDS_MODE: EndsMode = 'never';
const MIN_NUM_INPUT_VALUE = 1;
const MAX_NUM_INPUT_VALUE = 9999;
const CHIP_TOOLTIP_DELAY_MS = 500;

function pluralize(word: string, count: number): string {
    return count > 1 ? `${word}s` : word;
}

const weekdayChips = WEEKDAY_ORDER.map((day) => ({
    value: day,
    label: day.charAt(0),
    tooltip: day,
}));

// Everything the form needs to fully restore itself to a prior point in
// time (either "freshly opened" or "last saved").
type Snapshot = {
    interval: number | string;
    freq: Freq;
    selectedDays: string[];
    monthlyMode: 'day-of-month' | 'nth-weekday';
    endsMode: EndsMode;
    endsOnDate: string | null;
    endsAfterOccurrences: number | string;
};

export const EventFormRepeatCustom = ({ stack, dateStr, onApply }: Props) => {
    const [interval, setInterval] = useState<number | string>(DEFAULT_INTERVAL);
    const [endsMode, setEndsMode] = useState<EndsMode>(DEFAULT_ENDS_MODE);
    const [endsOnDate, setEndsOnDate] = useState<string | null>(() =>
        dayjs(dateStr).add(1, "week").format("YYYY-MM-DD")
    ); const [endsAfterOccurrences, setEndsAfterOccurrences] = useState<number | string>(DEFAULT_OCCURRENCES);
    const [freq, setFreq] = useState<Freq>(DEFAULT_FREQ);
    const today = dayjs(dateStr);
    const dayOfWeek = today.format("dddd");

    // Real selection state -- also what gets serialized into BYDAY.
    const [selectedDays, setSelectedDays] = useState<string[]>([dayOfWeek]);
    useEffect(() => {
        setSelectedDays([dayOfWeek]);
    }, [dayOfWeek]);

    const handleDaysChange = (values: string[]) => {
        if (values.length === 0) return; // at least one day must stay selected
        setSelectedDays(values);
    };

    // Semantic key, not a label -- see monthlyData below for why.
    const [monthlyMode, setMonthlyMode] = useState<'day-of-month' | 'nth-weekday'>(DEFAULT_MONTHLY_MODE);

    const data = useMemo(
        () => FREQ_UNITS.map((u) => ({
            value: u.value,
            label: pluralize(u.label, typeof interval === 'number' ? interval : 0),
        })),
        [interval]
    );

    const monthlyData = useMemo(() => ([
        { value: 'day-of-month', label: `Monthly on day ${today.date()}` },
        { value: 'nth-weekday', label: `Monthly on ${nthWeekdaySuffix(today)}` },
    ]), [today]);

    const buildEnd = (): RecurrenceEnd => {
        switch (endsMode) {
            case 'on':
                return endsOnDate ? { type: 'on', date: endsOnDate } : { type: 'never' };
            case 'after':
                return { type: 'after', occurrences: typeof endsAfterOccurrences === 'number' ? endsAfterOccurrences : 1 };
            case 'never':
            default:
                return { type: 'never' };
        }
    };

    const buildRule = (): CustomRecurrenceRule => {
        const intervalNum = typeof interval === 'number' ? interval : DEFAULT_INTERVAL;
        const end = buildEnd();
        switch (freq) {
            case 'DAILY':
                return { freq: 'DAILY', interval: intervalNum, end };
            case 'MONTHLY':
                return { freq: 'MONTHLY', interval: intervalNum, mode: monthlyMode, end };
            case 'YEARLY':
                return { freq: 'YEARLY', interval: intervalNum, end };
            case 'WEEKLY':
            default:
                return { freq: 'WEEKLY', interval: intervalNum, byDay: selectedDays, end };
        }
    };

    const getSnapshot = (): Snapshot => ({
        interval,
        freq,
        selectedDays,
        monthlyMode,
        endsMode,
        endsOnDate,
        endsAfterOccurrences,
    });

    const restoreSnapshot = (snapshot: Snapshot) => {
        setInterval(snapshot.interval);
        setFreq(snapshot.freq);
        setSelectedDays(snapshot.selectedDays);
        setMonthlyMode(snapshot.monthlyMode);
        setEndsMode(snapshot.endsMode);
        setEndsOnDate(snapshot.endsOnDate);
        setEndsAfterOccurrences(snapshot.endsAfterOccurrences);
    };

    // What Cancel reverts to: the last-saved configuration, or the
    // untouched defaults if nothing's been saved yet. Only moves forward
    // on Save -- never mutated by in-progress edits, so Cancel always
    // discards exactly what was changed since the last Save (or open).
    const lastSavedSnapshotRef = useRef<Snapshot>(getSnapshot());

    const handleSave = () => {
        onApply(buildRule());
        lastSavedSnapshotRef.current = getSnapshot();
        stack?.close('recurrence');
        stack?.open('event-form');
    };

    const handleCancel = () => {
        stack?.close('recurrence');
        stack?.open('event-form');
        restoreSnapshot(lastSavedSnapshotRef.current);
    };

    const handleRepeatEveryBlur = () => {
        if (typeof interval === 'string') {
            setInterval(DEFAULT_INTERVAL);
        }
    }

    const handleAfterBlur = () => {
        if (typeof endsAfterOccurrences === 'string') {
            setEndsAfterOccurrences(DEFAULT_OCCURRENCES);
        }
    }

    // Same issue as EventForm's own Modal: stack?.register(...) is
    // undefined with no stack, which would otherwise leave `opened` unset
    // against ModalProps' required boolean. Unlike EventForm, this modal
    // has no independent `opened` prop of its own -- it's only ever opened
    // via stack.open('recurrence') -- so without a stack there's simply no
    // way to open it, and the fallback is just `false`.
    const recurrenceStackProps = stack?.register('recurrence');

    return (
        <Modal
            {...recurrenceStackProps}
            opened={recurrenceStackProps?.opened ?? false}
            title="Custom recurrence"
            onClose={handleCancel}
            centered
            size="sm"
        >
            <div className="event-form-repeat-custom--section">
                <span className="event-form-repeat-custom--section-text">Repeat every</span>
                <NumberInput
                    value={interval}
                    onChange={setInterval}
                    onBlur={handleRepeatEveryBlur}
                    min={MIN_NUM_INPUT_VALUE}
                    max={MAX_NUM_INPUT_VALUE}
                    clampBehavior="blur"
                    allowNegative={false}
                    allowDecimal={false}
                    aria-label="Repeat every"
                    w={70}
                />
                <Select
                    data={data}
                    value={freq}
                    onChange={(v) => setFreq((v ?? DEFAULT_FREQ) as Freq)}
                    w={120}
                    allowDeselect={false}
                />
            </div>

            {freq === 'WEEKLY' && (
                <div className="event-form-repeat-custom--vertical-section">
                    <span className="event-form-repeat-custom--section-text">Repeat on</span>
                    <div className="event-form-repeat-custom--multiday">
                        <Chip.Group multiple value={selectedDays} onChange={handleDaysChange}>
                            <Group justify="center" pt={8} gap=".25rem">
                                <Tooltip.Group openDelay={CHIP_TOOLTIP_DELAY_MS} closeDelay={CHIP_TOOLTIP_DELAY_MS}>
                                    {weekdayChips.map((chip) => (
                                        <WeekdayChip key={chip.value} label={chip.label} value={chip.value} tooltip={chip.tooltip} />
                                    ))}
                                </Tooltip.Group>
                            </Group>
                        </Chip.Group>
                    </div>
                </div>
            )}

            {freq === "MONTHLY" && (
                <Select
                    data={monthlyData}
                    value={monthlyMode}
                    onChange={(v) => setMonthlyMode((v ?? DEFAULT_MONTHLY_MODE) as 'day-of-month' | 'nth-weekday')}
                    allowDeselect={false}
                />
            )}

            {/* TODO: Ends: Radio selections (Never / On [date] / After [x occurrences])*/}
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
                                    <Radio.Indicator />
                                    <span className="radio-label">Never</span>
                                </div>
                            </Radio.Card>
                            <Radio.Card
                                value="on"
                                key="on"
                                className="radio-root"
                            >
                                <div className="radio-root-label">
                                    <Radio.Indicator />
                                    <span className="radio-label">On</span>
                                </div>
                                <DateInput
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
                                    <Radio.Indicator />
                                    <span className="radio-label">After</span>
                                </div>
                                <NumberInput
                                    suffix={endsAfterOccurrences === 1 ? " occurrence" : " occurrences"}
                                    w={150}
                                    value={endsAfterOccurrences}
                                    onChange={setEndsAfterOccurrences}
                                    onBlur={handleAfterBlur}
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
            {/* TODO: Footer buttons */}
            <Button onClick={handleCancel}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
        </Modal>
    )
}
