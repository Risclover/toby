import { useEffect, useMemo, useRef, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { Modal, Group, Stack, useModalsStack, } from "@mantine/core";

import { EventFormRepeat } from "./Recurrence/EventFormRepeat";
import { EventFormRepeatCustom } from "./Recurrence/EventFormRepeatCustom";
import { useHousehold, useIsSmallScreen, useModalFocus } from "@/hooks";
import { useEventForm } from "../../hooks/useEventForm";
import { useAuthenticateQuery, useGetUserSettingsQuery, useCreateEventMutation, useUpdateEventMutation, useExcludeEventOccurrenceMutation, type CalendarEvent } from "@/store";
import { buildRRule, matchingPresetKind, parseRRule, type CustomRecurrenceRule, type PresetKind } from "../../utils/recurrence";
import type { ModalId } from "../../types";

import "../../styles/QuickAddEvent.css";
import { EventFormVisibility } from "./EventFormVisibility";
import { EventFormAssignedUsers } from "./EventFormAssignedUsers";
import { EventFormTitle } from "./EventFormTitle";
import { EventFormDates } from "./EventFormDates";
import { EventFormTimes } from "./EventFormTimes";
import { ButtonStandard } from "@/components/ButtonStandard";
import { ModalFooter } from "@/components/ModalFooter";
import { combineLocalFromStrings } from "../../utils/combineLocalFromStrings";
import { hmFromIso, ymdFromIso } from "../../utils/fromIso";
import { roundUpToNearest30Min } from "../../utils/roundUpToNearest30Min";
import { toAllDayStartUtc, toAllDayEndUtc } from "../../utils/allDayBoundary";
import { EditRecurringEventConfirmation, type EditScope } from "../EditRecurringEventConfirmation";
import { isAllDayValue } from "../../utils/getEventColors";


dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);

export const DEFAULT_EVENT_DURATION_HOURS = 1;
export const TIME_FORMAT = 'HH:mm'; // 'HH:mm:ss' if TimeInput has withSeconds

type Props = {
    householdId: number;
    opened: boolean;
    initialDate: Date;
    /** Prefills a specific time range (from a clicked/dragged Day/Week view slot) and starts the form in timed mode instead of the all-day default. Omit for the previous all-day-default behavior. */
    initialStartTime?: string;
    initialEndTime?: string;
    /** Distinct end date for a range that spans more than one day (e.g. a Week view drag that crosses days). Omit or match initialDate for a same-day event. */
    initialEndDate?: string;
    /**
     * `{ saved: true }` distinguishes a successful save from a Cancel/close-X
     * dismissal, so the caller (FullPageCalendar) can tell whether the data
     * it's about to show again (e.g. reopening EventDetailsModal) might now
     * be stale.
     */
    onClose: (options?: { saved?: boolean }) => void;
    edit: boolean;
    event?: CalendarEvent;
    stack?: ReturnType<typeof useModalsStack<ModalId>>;
}
export function EventForm({
    householdId,
    opened,
    initialDate,
    initialStartTime,
    initialEndTime,
    initialEndDate,
    onClose,
    edit,
    event,
    stack
}: Props) {
    // State
    const [repeatKind, setRepeatKind] = useState<PresetKind | 'custom'>('none');
    const [customRule, setCustomRule] = useState<CustomRecurrenceRule | null>(null);
    const [recurrenceSessionId, setRecurrenceSessionId] = useState(0);
    // When saving an edit to a recurring event, the fields are built up
    // front (title/dates/times/visibility/assignees/rrule) and stashed
    // here while EditRecurringEventConfirmation asks which occurrences
    // the edit should apply to -- the actual mutation only fires once
    // that's answered.
    const [pendingScheduleFields, setPendingScheduleFields] = useState<Record<string, unknown> | null>(null);
    const [scopeModalOpened, setScopeModalOpened] = useState(false);

    // Queries
    const { data: user } = useAuthenticateQuery();
    const { data: household } = useHousehold();
    const { data: userSettings } = useGetUserSettingsQuery(user.id);

    // Mutations
    const [createEvent, { isLoading: creating }] = useCreateEventMutation();
    const [updateEvent, { isLoading: updating }] = useUpdateEventMutation();
    const [excludeEventOccurrence, { isLoading: excluding }] = useExcludeEventOccurrenceMutation();

    const isSmallScreen = useIsSmallScreen(475);
    const { ref: nameRef, transitionProps } = useModalFocus(!edit);
    const { form, startDate, title } = useEventForm({
        currentUserId: user.id,
        startDate: event
            ? ymdFromIso(event.startUtc ?? undefined, isAllDayValue(event.hasTime) ? (event.tzid ?? "UTC") : undefined)
            : dayjs(initialDate).format("YYYY-MM-DD"),
    });

    // Ref
    const lastEnteredStartTimeRef = useRef(form.getValues().startTime);
    const lastEnteredEndTimeRef = useRef(form.getValues().endTime);
    const endTimeManuallySetRef = useRef(false);

    // Effects
    useEffect(() => {
        if (!opened) return;
        if (event?.id) {
            seedFromEvent(event);
        } else {
            seedBlank(dayjs(initialDate).format("YYYY-MM-DD"));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [opened, event?.id, initialDate.getTime(), initialStartTime, initialEndTime, initialEndDate]);

    // Constants
    const allHouseholdMemberIds = useMemo(
        () => household?.members?.map((m: { id: number }) => m.id) ?? [],
        [household]
    );

    const isEditMode = edit && !!event;
    const modalTitle = isEditMode ? "Edit event" : "Add event";
    const isSaving = creating || updating || excluding;
    const eventFormStackProps = stack?.register('event-form');

    // Form seeds

    // Establishes a NEW baseline for this modal instance -- call whenever
    // it should represent a fresh, blank add for the given date.
    const seedBlank = (seededDate: string) => {
        setRepeatKind('none');
        setCustomRule(null);
        setRecurrenceSessionId((n) => n + 1);

        const hasSlotTimes = Boolean(initialStartTime && initialEndTime);
        const defaultStartTime = hasSlotTimes
            ? dayjs(initialStartTime, TIME_FORMAT)
            : roundUpToNearest30Min(dayjs());
        const defaultEndTime = hasSlotTimes
            ? dayjs(initialEndTime, TIME_FORMAT)
            : defaultStartTime.add(DEFAULT_EVENT_DURATION_HOURS, 'hour');
        const seededEndDate = initialEndDate && initialEndDate !== seededDate ? initialEndDate : '';

        const values = {
            title: '',
            startDate: seededDate,
            endDate: seededEndDate,
            allDay: !hasSlotTimes,
            startTime: defaultStartTime.format(TIME_FORMAT),
            endTime: defaultEndTime.format(TIME_FORMAT),
            visibility: userSettings?.settings.eventsPrivacyMode === "private_by_default" ? "private" : 'public' as const,
            assignedUserIds: [user.id],
            allMembers: false,
        };
        form.setValues(values);
        form.setInitialValues(values);
        lastEnteredStartTimeRef.current = values.startTime;
        lastEnteredEndTimeRef.current = values.endTime;
        endTimeManuallySetRef.current = false;
    };

    // Establishes a NEW baseline representing an existing event -- used
    // for the externally-passed `event` prop (edit mode).
    const seedFromEvent = (targetEvent: CalendarEvent) => {
        const isAllDay = isAllDayValue(targetEvent.hasTime);
        const tzid = targetEvent.tzid ?? "UTC";

        const seededDate = ymdFromIso(targetEvent.startUtc ?? undefined, isAllDay ? tzid : undefined);
        // toAllDayEndUtc stores an EXCLUSIVE boundary (midnight of the day
        // AFTER the last inclusive day), so recovering the inclusive last
        // day needs the same -1 second nudge toEventEnd uses before
        // formatting -- otherwise a multi-day all-day event's end date
        // reads one day past what was actually selected.
        const seededEndDate = isAllDay
            ? (targetEvent.endUtc
                ? ymdFromIso(dayjs(targetEvent.endUtc).subtract(1, "second").toISOString(), tzid)
                : '')
            : ymdFromIso(targetEvent.endUtc ?? undefined);
        const seededTime = isAllDay ? "" : hmFromIso(targetEvent.startUtc);
        const seededEndTime = isAllDay ? "" : hmFromIso(targetEvent.endUtc);
        const { repeatKind: seededRepeatKind, customRule: seededCustomRule } = parseRRule(targetEvent.rrule, dayjs(seededDate));

        setRepeatKind(seededRepeatKind);
        setCustomRule(seededCustomRule);
        setRecurrenceSessionId((n) => n + 1);

        const values = {
            title: targetEvent.title,
            startDate: seededDate,
            endDate: seededEndDate === seededDate ? '' : seededEndDate,
            allDay: isAllDay,
            startTime: seededTime,
            endTime: seededEndTime,
            visibility: targetEvent.visibility,
            assignedUserIds: targetEvent.attendeeIds?.length ? targetEvent.attendeeIds : (targetEvent.allMembers ? allHouseholdMemberIds : [user.id]),
            allMembers: targetEvent.allMembers
        };
        form.setValues(values);
        form.setInitialValues(values);
        endTimeManuallySetRef.current = false;
    };

    // Handlers
    const handleApplyCustomRule = (rule: CustomRecurrenceRule) => {
        setCustomRule(rule);
        const preset = matchingPresetKind(rule, dayjs(startDate));
        setRepeatKind(preset ?? 'custom');
    };

    const handleClose = () => {
        form.reset();
        setRepeatKind('none');
        setCustomRule(null);
        setPendingScheduleFields(null);
        setScopeModalOpened(false);
        onClose();
    };

    // Builds the update/create payload's schedule-related fields
    // (everything except id/householdId/rrule) from the form's current
    // values -- shared by the create path, the "all events" edit path,
    // and the "just this event" detach-and-recreate path, so the
    // hasTime/!hasTime branching only lives in one place.
    const buildScheduleFields = () => {
        const values = form.getValues();
        const tzid = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const hasTime = !values.allDay;

        if (hasTime) {
            const startLocal = combineLocalFromStrings(values.startDate, values.startTime);
            const effectiveEndDate = values.endDate || values.startDate;
            const endLocal = values.endTime
                ? combineLocalFromStrings(effectiveEndDate, values.endTime)
                : dayjs(startLocal).add(DEFAULT_EVENT_DURATION_HOURS, "hour").toDate();
            return {
                title: values.title.trim(),
                tzid,
                startUtc: startLocal.toISOString(),
                endUtc: endLocal.toISOString(),
                // Explicit, not implied by omission -- the all-day branch
                // below explicitly sends hasTime: false, so an UPDATE that
                // flips an existing all-day event to timed has to just as
                // explicitly send hasTime: true. Leaving this out "worked"
                // when creating a brand-new timed event (nothing stale to
                // overwrite), but on an edit, a PATCH that only touches the
                // fields it's given would leave the event's hasTime stuck at
                // its old `false` while startUtc/endUtc switch to real UTC
                // instants -- a mismatch that made every recurring occurrence
                // (and the frontend code that decides wall-clock vs. real-
                // instant parsing from that same flag) silently stop
                // resolving to anything, which is exactly the "all instances
                // disappear" bug this fixes.
                hasTime: true,
                visibility: values.visibility,
                allMembers: values.allMembers,
                attendeeIds: values.assignedUserIds,
            };
        }

        return {
            title: values.title.trim(),
            tzid,
            startUtc: toAllDayStartUtc(values.startDate, tzid),
            endUtc: toAllDayEndUtc(values.endDate || values.startDate, tzid),
            hasTime: false,
            visibility: values.visibility,
            allMembers: values.allMembers,
            attendeeIds: values.assignedUserIds,
        };
    };

    const handleSave = async () => {
        const { hasErrors } = form.validate();
        if (hasErrors) return;

        const values = form.getValues();
        const hasTime = !values.allDay;
        const rrule = buildRRule(repeatKind, customRule, dayjs(values.startDate), hasTime);

        try {
            if (edit && event) {
                if (event.rrule) {
                    // Recurring event -- don't silently update the whole
                    // series. Stash the built fields and ask which
                    // occurrences this edit applies to; the actual
                    // mutation happens in handleConfirmScope once answered.
                    setPendingScheduleFields({ ...buildScheduleFields(), rrule });
                    setScopeModalOpened(true);
                    return;
                }
                await updateEvent({ id: event.id, householdId, ...buildScheduleFields(), rrule }).unwrap();
                onClose({ saved: true });
                return;
            } else {
                await createEvent({ householdId, ...buildScheduleFields(), rrule } as any).unwrap();
            }
            onClose();
        } catch (e) {
            console.error(e);
        }
    };

    // Answers the this-event/all-events prompt for a recurring edit.
    const handleConfirmScope = async (scope: EditScope) => {
        if (!event || !pendingScheduleFields) return;

        try {
            if (scope === "all-events") {
                await updateEvent({ id: event.id, householdId, ...pendingScheduleFields }).unwrap();
            } else {
                // "Just this event": exclude the ORIGINAL (pre-edit)
                // occurrence's own date from the series -- event.startUtc/
                // tzid here are already the CLICKED occurrence's values
                // (EventActionsMenu.handleEdit sets them before opening
                // this form), not the series' first occurrence -- then
                // create a new standalone, non-recurring event with the
                // edited fields. Same exclude-and-recreate pattern
                // persistEventMove already uses for a recurring
                // drag/resize, and DeleteRecurringEventConfirmation
                // already uses for a single-occurrence delete.
                const originalTzid = event.tzid ?? "UTC";
                const originalOccurrenceStart = dayjs(event.startUtc).tz(originalTzid).format("YYYY-MM-DD HH:mm:ss");
                await excludeEventOccurrence({
                    id: event.id,
                    householdId,
                    occurrenceStart: originalOccurrenceStart,
                }).unwrap();

                // A detached single occurrence is never itself recurring,
                // regardless of whatever repeat pattern was showing in the
                // form -- that pattern belonged to the series, and this is
                // no longer part of it.
                const { rrule: _seriesRrule, ...detachedFields } = pendingScheduleFields as Record<string, unknown> & { rrule?: string };
                await createEvent({ householdId, ...detachedFields } as any).unwrap();
            }
            setScopeModalOpened(false);
            setPendingScheduleFields(null);
            onClose({ saved: true });
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <>
            <Modal.Stack>
                <Modal
                    {...eventFormStackProps}
                    opened={eventFormStackProps?.opened ?? opened}
                    transitionProps={transitionProps}
                    onClose={handleClose}
                    radius="md"
                    title={modalTitle}
                    centered
                    keepMounted
                    fullScreen={isSmallScreen}
                    styles={{
                        body: { display: "flex", flexDirection: "column", height: "100%", padding: 0, overflow: "hidden" },
                        content: { overflow: "hidden", maxHeight: "100%", display: "flex", flexDirection: "column" },
                    }}
                >
                    <div className="event-form-modal--body">
                        <EventFormTitle form={form} title={title} nameRef={nameRef} />
                        <Stack gap="md">
                            <Stack gap="sm">
                                <EventFormDates form={form} isSmallScreen={isSmallScreen} />
                                {!form.getValues().allDay &&
                                    <EventFormTimes form={form} endTimeManuallySetRef={endTimeManuallySetRef} />
                                }
                            </Stack>
                            <EventFormRepeat
                                dateValue={startDate}
                                stack={stack}
                                customRule={customRule}
                                repeatKind={repeatKind}
                                onRepeatKindChange={setRepeatKind}
                            />
                            <EventFormVisibility form={form} />
                            {(household?.members?.length ?? 0) > 1 && (
                                <EventFormAssignedUsers form={form} household={household} />
                            )}
                        </Stack>
                    </div>
                    <ModalFooter>
                        <Group w="100%" justify="flex-end">
                            <ButtonStandard onClick={handleClose} label="Cancel" variant="outline" />
                            <ButtonStandard onClick={handleSave} isLoading={isSaving} label={isEditMode ? "Update" : "Save"} variant="filled" disabled={!form.isValid()} />
                        </Group>
                    </ModalFooter>
                </Modal>
                <EventFormRepeatCustom
                    key={recurrenceSessionId}
                    stack={stack}
                    dateStr={startDate}
                    onApply={handleApplyCustomRule}
                />
            </Modal.Stack>
            <EditRecurringEventConfirmation
                opened={scopeModalOpened}
                onClose={() => setScopeModalOpened(false)}
                onConfirm={handleConfirmScope}
                isSaving={isSaving}
            />
        </>
    );
}