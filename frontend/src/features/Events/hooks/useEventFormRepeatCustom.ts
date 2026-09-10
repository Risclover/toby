import { useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import type { useModalsStack } from "@mantine/core";
import type { DateTimeStringValue } from "@mantine/dates";

import { useClampedNumberInput } from "./useClampedNumberInput";
import {
    nthWeekdaySuffix,
    pluralizeUnit,
    type CustomRecurrenceRule,
    type RecurrenceEnd
} from "../utils/recurrence"
import type { ModalId } from "../types";

export type Freq = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
export type EndsMode = "never" | "on" | "after";

type RecurrenceCustomState = {
    repeatInterval: number | string;
    freq: Freq;
    selectedDays: string[];
    monthlyMode: "day-of-month" | "nth-weekday";
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
    { value: "DAILY", label: "day" },
    { value: "WEEKLY", label: "week" },
    { value: "MONTHLY", label: "month" },
    { value: "YEARLY", label: "year" },
];

const DEFAULT_INTERVAL = 1;
const DEFAULT_OCCURRENCES = 5;
const DEFAULT_FREQ: Freq = "WEEKLY";
const DEFAULT_MONTHLY_MODE = "nth-weekday" as const;
const DEFAULT_ENDS_MODE: EndsMode = "never";

export function useEventFormRepeatCustom({ stack, dateStr, onApply }: Props) {
    const today = dayjs(dateStr);
    const dayOfWeek = today.format("dddd");

    const [state, setState] = useState<RecurrenceCustomState>(() => ({
        repeatInterval: DEFAULT_INTERVAL,
        freq: DEFAULT_FREQ,
        selectedDays: [dayOfWeek],
        monthlyMode: DEFAULT_MONTHLY_MODE,
        endsMode: DEFAULT_ENDS_MODE,
        endsOnDate: dayjs(dateStr).add(1, "week").format("YYYY-MM-DD"),
        endsAfterOccurrences: DEFAULT_OCCURRENCES,
    }));

    // Event's date can change without this component remounting (e.g. user
    // edits the start date while this modal is still in the stack) -- keep
    // the default "repeat on" day selection following it.
    useEffect(() => {
        setState((s) => ({ ...s, selectedDays: [dayOfWeek] }));
    }, [dayOfWeek]);

    const setRepeatInterval = (v: number | string) => setState((s) => ({ ...s, repeatInterval: v }));
    const setFreq = (v: Freq | null) => setState((s) => ({ ...s, freq: v ?? DEFAULT_FREQ }));
    const setMonthlyMode = (v: "day-of-month" | "nth-weekday" | null) =>
        setState((s) => ({ ...s, monthlyMode: v ?? DEFAULT_MONTHLY_MODE }));
    const setEndsMode = (v: EndsMode) => setState((s) => ({ ...s, endsMode: v }));
    const setEndsOnDate = (v: string | null) => setState((s) => ({ ...s, endsOnDate: v }));
    const setEndsAfterOccurrences = (v: number | string) => setState((s) => ({ ...s, endsAfterOccurrences: v }));

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
        { value: "day-of-month", label: `Monthly on day ${today.date()}` },
        { value: "nth-weekday", label: `Monthly on ${nthWeekdaySuffix(today)}` },
    ]), [today]);

    const buildEnd = (): RecurrenceEnd => {
        switch (state.endsMode) {
            case "on":
                return state.endsOnDate ? { type: "on", date: state.endsOnDate } : { type: "never" };
            case "after":
                return { type: "after", occurrences: typeof state.endsAfterOccurrences === "number" ? state.endsAfterOccurrences : 1 };
            case "never":
            default:
                return { type: "never" };
        }
    };

    const buildRule = (): CustomRecurrenceRule => {
        const intervalNum = typeof state.repeatInterval === "number" ? state.repeatInterval : DEFAULT_INTERVAL;
        const end = buildEnd();
        switch (state.freq) {
            case "DAILY":
                return { freq: "DAILY", interval: intervalNum, end };
            case "MONTHLY":
                return { freq: "MONTHLY", interval: intervalNum, mode: state.monthlyMode, end };
            case "YEARLY":
                return { freq: "YEARLY", interval: intervalNum, end };
            case "WEEKLY":
            default:
                return { freq: "WEEKLY", interval: intervalNum, byDay: state.selectedDays, end };
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
        // State
        freq: state.freq,
        setFreq,
        selectedDays: state.selectedDays,
        onDaysChange,
        monthlyMode: state.monthlyMode,
        setMonthlyMode,
        endsMode: state.endsMode,
        setEndsMode,
        endsOnDate: state.endsOnDate,
        setEndsOnDate,

        // Derived display data
        freqOptions,
        monthlyData,
        today,

        // Clamped number inputs
        repeatEvery,
        afterOccurrences,

        // Actions
        handleSave,
        handleCancel,
    };
}