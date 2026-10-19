import { useState } from "react";
import dayjs from "dayjs";
import {
    matchingPresetKind,
    type CustomRecurrenceRule,
    type EventFormState,
    type RepeatKind
} from "../utils";

type RecurrenceState = Pick<EventFormState, "repeatKind" | "customRule">;
const NO_RECURRENCE: RecurrenceState = { repeatKind: "none", customRule: null };

type UseEventFormRecurrenceProps = {
    startDate: string;
};

export type EventFormRecurrence = ReturnType<typeof useEventFormRecurrence>;

export function useEventFormRecurrence({ startDate }: UseEventFormRecurrenceProps) {
    const [repeatKind, setRepeatKind] = useState<RepeatKind>(NO_RECURRENCE.repeatKind);
    const [customRule, setCustomRule] = useState<CustomRecurrenceRule | null>(NO_RECURRENCE.customRule);
    const [sessionId, setSessionId] = useState(0);

    const restart = (state: RecurrenceState = NO_RECURRENCE) => {
        setRepeatKind(state.repeatKind);
        setCustomRule(state.customRule);
        setSessionId((id) => id + 1);
    };

    const clear = () => {
        setRepeatKind(NO_RECURRENCE.repeatKind);
        setCustomRule(NO_RECURRENCE.customRule);
    };

    const applyCustomRule = (rule: CustomRecurrenceRule) => {
        setCustomRule(rule);
        setRepeatKind(matchingPresetKind(rule, dayjs(startDate)) ?? "custom");
    };

    return { repeatKind, customRule, sessionId, setRepeatKind, restart, clear, applyCustomRule };
}