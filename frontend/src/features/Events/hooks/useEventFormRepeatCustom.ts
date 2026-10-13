import { useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import type { useModalsStack } from "@mantine/core";
import type { DateTimeStringValue } from "@mantine/dates";

import { useClampedNumberInput } from "./useClampedNumberInput";
import type { ModalId } from "../types";
import {
    nthWeekdaySuffix,
    pluralizeUnit,
    type CustomRecurrenceRule,
    type RecurrenceEnd,
} from "../utils/recurrence";

export const FREQ = {
    DAILY: "DAILY",
    WEEKLY: "WEEKLY",
    MONTHLY: "MONTHLY",
    YEARLY: "YEARLY",
} as const;

export const MONTHLY_MODE = {
    DAY_OF_MONTH: "day-of-month",
    NTH_WEEKDAY: "nth-weekday",
} as const;

export const ENDS_MODE = {
    NEVER: "never",
    ON: "on",
    AFTER: "after",
} as const;

export type Freq = (typeof FREQ)[keyof typeof FREQ];
export type MonthlyMode = (typeof MONTHLY_MODE)[keyof typeof MONTHLY_MODE];
export type EndsMode = (typeof ENDS_MODE)[keyof typeof ENDS_MODE];

type RecurrenceCustomState = {
    repeatInterval: number | string;
    freq: Freq;
    selectedDays: string[];
    monthlyMode: MonthlyMode;
    endsMode: EndsMode;
    endsOnDate: string | null;
    endsAfterOccurrences: number | string;
};

type Props = {
    /** Modal stack */
    stack: ReturnType<typeof useModalsStack<ModalId>> | undefined;
    /** Selected date */
    dateStr: DateTimeStringValue;
    /** What happens when custom recurrence rule is applied */
    onApply: (rule: CustomRecurrenceRule) => void;
};

const FREQ_UNITS = [
    { value: FREQ.DAILY, label: "day" },
    { value: FREQ.WEEKLY, label: "week" },
    { value: FREQ.MONTHLY, label: "month" },
    { value: FREQ.YEARLY, label: "year" },
];

const DEFAULT_INTERVAL = 1;
const DEFAULT_OCCURRENCES = 5;
const DEFAULT_FREQ: Freq = FREQ.WEEKLY;
const DEFAULT_MONTHLY_MODE: MonthlyMode = MONTHLY_MODE.NTH_WEEKDAY;
const DEFAULT_ENDS_MODE: EndsMode = ENDS_MODE.NEVER;
const FALLBACK_OCCURRENCES = 1;
const DEFAULT_ENDS_ON_OFFSET_WEEKS = 1;
const WEEKDAY_FORMAT = "dddd";
const ISO_DATE_FORMAT = "YYYY-MM-DD";

export function useEventFormRepeatCustom({ stack, dateStr, onApply }: Props) {
    const today = useMemo(() => dayjs(dateStr), [dateStr]);
    const dayOfWeek = today.format(WEEKDAY_FORMAT);

    const [state, setState] = useState<RecurrenceCustomState>(() => ({
        repeatInterval: DEFAULT_INTERVAL,
        freq: DEFAULT_FREQ,
        selectedDays: [dayOfWeek],
        monthlyMode: DEFAULT_MONTHLY_MODE,
        endsMode: DEFAULT_ENDS_MODE,
        endsOnDate: today.add(DEFAULT_ENDS_ON_OFFSET_WEEKS, "week").format(ISO_DATE_FORMAT),
        endsAfterOccurrences: DEFAULT_OCCURRENCES,
    }));

    // The event's date can change while this modal stays mounted; keep the
    // default "repeat on" day following it.
    useEffect(() => {
        setState((s) => ({ ...s, selectedDays: [dayOfWeek] }));
    }, [dayOfWeek]);

    const setRepeatInterval = (v: number | string) => setState((s) => ({ ...s, repeatInterval: v }));
    const setEndsMode = (v: EndsMode) => setState((s) => ({ ...s, endsMode: v }));
    const setEndsOnDate = (v: string | null) => setState((s) => ({ ...s, endsOnDate: v }));
    const setEndsAfterOccurrences = (v: number | string) => setState((s) => ({ ...s, endsAfterOccurrences: v }));

    const onFreqChange = (value: string | null) =>
        setState((s) => ({ ...s, freq: (value as Freq | null) ?? DEFAULT_FREQ }));

    const onMonthlyModeChange = (value: string | null) =>
        setState((s) => ({ ...s, monthlyMode: (value as MonthlyMode | null) ?? DEFAULT_MONTHLY_MODE }));

    const onDaysChange = (values: string[]) => {
        if (values.length === 0) return;
        setState((s) => ({ ...s, selectedDays: values }));
    };

    const repeatEvery = useClampedNumberInput(state.repeatInterval, setRepeatInterval, DEFAULT_INTERVAL);
    const afterOccurrences = useClampedNumberInput(state.endsAfterOccurrences, setEndsAfterOccurrences, DEFAULT_OCCURRENCES);

    const freqOptions = useMemo(
        () => FREQ_UNITS.map((u) => ({
            value: u.value,
            label: pluralizeUnit(u.label, typeof state.repeatInterval === "number" ? state.repeatInterval : 0),
        })),
        [state.repeatInterval]
    );

    const monthlyData = useMemo(() => ([
        { value: MONTHLY_MODE.DAY_OF_MONTH, label: `Monthly on day ${today.date()}` },
        { value: MONTHLY_MODE.NTH_WEEKDAY, label: `Monthly on ${nthWeekdaySuffix(today)}` },
    ]), [today]);

    const buildEnd = (): RecurrenceEnd => {
        switch (state.endsMode) {
            case ENDS_MODE.ON:
                return state.endsOnDate ? { type: "on", date: state.endsOnDate } : { type: "never" };
            case ENDS_MODE.AFTER:
                return {
                    type: "after",
                    occurrences: typeof state.endsAfterOccurrences === "number" ? state.endsAfterOccurrences : FALLBACK_OCCURRENCES,
                };
            case ENDS_MODE.NEVER:
            default:
                return { type: "never" };
        }
    };

    const buildRule = (): CustomRecurrenceRule => {
        const interval = typeof state.repeatInterval === "number" ? state.repeatInterval : DEFAULT_INTERVAL;
        const end = buildEnd();
        switch (state.freq) {
            case FREQ.DAILY:
                return { freq: FREQ.DAILY, interval, end };
            case FREQ.MONTHLY:
                return { freq: FREQ.MONTHLY, interval, mode: state.monthlyMode, end };
            case FREQ.YEARLY:
                return { freq: FREQ.YEARLY, interval, end };
            case FREQ.WEEKLY:
            default:
                return { freq: FREQ.WEEKLY, interval, byDay: state.selectedDays, end };
        }
    };

    const lastSavedStateRef = useRef<RecurrenceCustomState>(state);

    const handleSave = () => {
        onApply(buildRule());
        lastSavedStateRef.current = state;
        stack?.close("recurrence");
        stack?.open("event-form");
    };

    const handleCancel = () => {
        stack?.close("recurrence");
        stack?.open("event-form");
        setState(lastSavedStateRef.current);
    };

    return {
        freq: state.freq,
        onFreqChange,
        selectedDays: state.selectedDays,
        onDaysChange,
        monthlyMode: state.monthlyMode,
        onMonthlyModeChange,
        endsMode: state.endsMode,
        setEndsMode,
        endsOnDate: state.endsOnDate,
        setEndsOnDate,
        freqOptions,
        monthlyData,
        today,
        repeatEvery,
        afterOccurrences,
        handleSave,
        handleCancel,
    };
}