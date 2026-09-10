import { Modal, useModalsStack } from "@mantine/core"
import { EventForm } from "./EventForm"
import { EventFormRepeatCustom } from "./Recurrence/EventFormRepeatCustom"
import { useAuthenticateQuery, type CalendarEvent } from "@/store";
import type { ModalId } from "../../types";
import { useState } from "react";
import { matchingPresetKind, type CustomRecurrenceRule, type PresetKind } from "../../utils/recurrence";
import dayjs from "dayjs";
import { useEventForm } from "../../hooks/useEventForm";

type Props = {
    householdId: number;
    opened: boolean;
    initialDate: Date;
    onClose: () => void;
    edit: boolean;
    event?: CalendarEvent;
    stack?: ReturnType<typeof useModalsStack<ModalId>>;
}
const ymdFromIso = (iso?: string | null, fallback = new Date()) =>
    dayjs(iso ?? fallback).format("YYYY-MM-DD");
export const EventFormContainer = ({
    householdId,
    opened,
    initialDate,
    onClose,
    edit,
    event,
    stack
}: Props) => {
    const { data: user } = useAuthenticateQuery();

    const [repeatKind, setRepeatKind] = useState<PresetKind | 'custom'>('none');
    const [recurrenceSessionId, setRecurrenceSessionId] = useState(0);
    const [customRule, setCustomRule] = useState<CustomRecurrenceRule | null>(null);

    const { form, startDate, title } = useEventForm({
        currentUserId: user.id,
        startDate: event ? ymdFromIso(event.startUtc ?? undefined) : dayjs(initialDate).format("YYYY-MM-DD"),
    });

    const handleApplyCustomRule = (rule: CustomRecurrenceRule) => {
        setCustomRule(rule);
        const preset = matchingPresetKind(rule, dayjs(startDate));
        setRepeatKind(preset ?? 'custom');
    };

    const eventFormProps = {
        householdId,
        opened,
        initialDate,
        onClose,
        edit,
        event,
        stack,
        repeatKind,
        setRepeatKind,
        recurrenceSessionId,
        setRecurrenceSessionId,
        customRule,
        setCustomRule,
        form,
        title,
        startDate,
    }
    return (
        <Modal.Stack>
            <EventForm
                householdId={householdId}
                opened={opened}
                initialDate={initialDate}
                onClose={onClose}
                edit={edit}
                event={event}
                stack={stack}
            />
            <EventFormRepeatCustom
                key={recurrenceSessionId}
                stack={stack}
                dateStr={startDate}
                onApply={handleApplyCustomRule}
            />
        </Modal.Stack>
    )
}