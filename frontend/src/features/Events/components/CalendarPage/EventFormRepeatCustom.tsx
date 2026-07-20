import { Button, Chip, Group, Modal, NumberInput, Radio, Select, Tooltip, useModalsStack } from "@mantine/core"
import { DateInput, type DateTimeStringValue } from "@mantine/dates";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { nthWeekdaySuffix, type CustomRecurrenceRule, type RecurrenceEnd } from "../../utils/recurrence";

type ModalId = 'recurrence' | 'event-form';
type EndsMode = 'never' | 'on' | 'after';

type Props = {
    stack: ReturnType<typeof useModalsStack<ModalId>>
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

function pluralize(word: string, count: number): string {
    return count > 1 ? `${word}s` : word;
}

const weekdayChips = [
    { value: "Sunday", label: "S", tooltip: "Sunday" },
    { value: "Monday", label: "M", tooltip: "Monday" },
    { value: "Tuesday", label: "T", tooltip: "Tuesday" },
    { value: "Wednesday", label: "W", tooltip: "Wednesday" },
    { value: "Thursday", label: "T", tooltip: "Thursday" },
    { value: "Friday", label: "F", tooltip: "Friday" },
    { value: "Saturday", label: "S", tooltip: "Saturday" },
];

export const EventFormRepeatCustom = ({ stack, dateStr, onApply }: Props) => {
    const [interval, setInterval] = useState<number | string>(1);
    const [endsMode, setEndsMode] = useState<EndsMode>('never');
    const [endsOnDate, setEndsOnDate] = useState<string | null>(() =>
        dayjs(dateStr).add(1, "week").format("YYYY-MM-DD")
    ); const [endsAfterOccurrences, setEndsAfterOccurrences] = useState<number | string>(5);
    const [freq, setFreq] = useState<string>('WEEKLY');
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
    const [monthlyMode, setMonthlyMode] = useState<'day-of-month' | 'nth-weekday'>('nth-weekday');

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
        const intervalNum = typeof interval === 'number' ? interval : 1;
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

    const handleSave = () => {
        onApply(buildRule());
        stack?.close('recurrence');
        stack?.open('event-form');
    };

    const toggleStack = () => {
        onApply(buildRule());
        stack.open('event-form');
        stack.close('recurrence');
        setInterval(1);
        setFreq("WEEKLY");
    }

    return (
        <Modal
            {...stack?.register('recurrence')}
            title="Custom recurrence"
            onClose={toggleStack}
            centered
            size="sm"
        >
            <div className="event-form-repeat-custom--section">
                <span className="event-form-repeat-custom--section-text">Repeat every</span>
                <NumberInput
                    value={interval}
                    onChange={setInterval}
                    onBlur={() => {
                        if (typeof interval === 'string') {
                            setInterval(1);
                        }
                    }}
                    min={1}
                    clampBehavior="blur"
                    allowNegative={false}
                    allowDecimal={false}
                    aria-label="Repeat every"
                    max={9999}
                    w={70}
                />
                <Select
                    data={data}
                    value={freq}
                    onChange={(v) => setFreq(v ?? 'WEEKLY')}
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
                                <Tooltip.Group openDelay={500} closeDelay={500}>
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
                    onChange={(v) => setMonthlyMode((v ?? 'nth-weekday') as 'day-of-month' | 'nth-weekday')}
                    allowDeselect={false}
                />
            )}

            {/* TODO: Ends: Radio selections (Never / On [date] / After [x occurrences])*/}
            <div className="event-form-repeat-custom--vertical-section">
                <span className="event-form-repeat-custom--section-text">Ends</span>
                <div className="event-form-repeat-custom--radio-group">
                    <Radio.Group defaultValue="Never" value={endsMode} onChange={setEndsMode}>
                        <Group mt="xs">
                            <Radio.Card
                                value="never"
                                key="Never"
                                className="radio-root"

                            >
                                <div className="radio-root-label">
                                    <Radio.Indicator />
                                    <span className="radio-label">Never</span>
                                </div>
                            </Radio.Card>
                            <Radio.Card
                                value="on"
                                key="On"
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
                                key="After"
                                className="radio-root"
                            >
                                <div className="radio-root-label">
                                    <Radio.Indicator />
                                    <span className="radio-label">After</span>
                                </div>
                                <NumberInput
                                    suffix={endsAfterOccurrences === 1 ? " occurrence" : " occurrences"}
                                    w={150}
                                    defaultValue={5}
                                    value={endsAfterOccurrences}
                                    onChange={setEndsAfterOccurrences}
                                    disabled={endsMode !== "after"}
                                    min={1}
                                    max={9999}
                                    clampBehavior="blur"
                                    allowNegative={false}
                                    allowDecimal={false}
                                    aria-label="After"
                                    onBlur={() => {
                                        if (typeof endsAfterOccurrences === 'string') {
                                            setEndsAfterOccurrences(5);
                                        }
                                    }}

                                />
                            </Radio.Card>
                        </Group>
                    </Radio.Group>
                </div>
            </div>
            {/* TODO: Footer buttons */}
            <Button onClick={toggleStack}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
        </Modal>
    )
}

type WeekdayChipProps = {
    label: string;
    value: string;
    tooltip: string;
}

const WeekdayChip = ({ label, value, tooltip }: WeekdayChipProps) => {
    const dayChipStyles = {
        label: {
            width: 32,
            height: 32,
            padding: 0,
            justifyContent: 'center' as const,
            borderRadius: '50%',
        },
    } as const;

    return (
        <Tooltip
            label={tooltip}
            refProp="rootRef"
            transitionProps={{
                duration: 100,
                transition: {
                    in: { opacity: 1, transform: 'scale(1) translateY(0)' },
                    out: { transform: 'scale(0.8) translateY(0)', opacity: 0 },
                    common: { transformOrigin: 'bottom' },
                    transitionProperty: 'opacity, transform',
                },
            }}
        >
            <Chip
                value={value}
                icon={null}
                styles={dayChipStyles}
                classNames={{ label: "day-chip" }}
                color="blue.6"
            >
                {label}
            </Chip>
        </Tooltip>
    )
}