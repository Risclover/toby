import { useEffect, useMemo, useRef, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { Modal, Group, Stack, useModalsStack, } from "@mantine/core";

import { EventFormRepeat } from "./Recurrence/EventFormRepeat";
import { EventFormRepeatCustom } from "./Recurrence/EventFormRepeatCustom";
import { useHousehold, useIsSmallScreen, useModalFocus } from "@/hooks";
import { useEventForm } from "../../hooks/useEventForm";
import { useAuthenticateQuery, useGetUserSettingsQuery, useCreateEventMutation, useUpdateEventMutation, type CalendarEvent } from "@/store";
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

dayjs.extend(customParseFormat);

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
    onClose: () => void;
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

    // Queries
    const { data: user } = useAuthenticateQuery();
    const { data: household } = useHousehold();
    const { data: userSettings } = useGetUserSettingsQuery(user.id);

    // Mutations
    const [createEvent, { isLoading: creating }] = useCreateEventMutation();
    const [updateEvent, { isLoading: updating }] = useUpdateEventMutation();

    const isSmallScreen = useIsSmallScreen(475);
    const { ref: nameRef, transitionProps } = useModalFocus(!edit);
    const { form, startDate, title } = useEventForm({
        currentUserId: user.id,
        startDate: event
            ? ymdFromIso(event.startUtc ?? undefined)
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
    const isSaving = creating || updating;
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
        console.log(targetEvent.rrule)
        const seededDate = ymdFromIso(targetEvent.startUtc ?? undefined);
        const seededEndDate = targetEvent.hasTime !== false ? ymdFromIso(targetEvent.endUtc ?? undefined) : '';
        const seededTime = targetEvent.hasTime === false ? "" : hmFromIso(targetEvent.startUtc);
        const seededEndTime = targetEvent.hasTime === false ? "" : hmFromIso(targetEvent.endUtc);
        const { repeatKind: seededRepeatKind, customRule: seededCustomRule } = parseRRule(targetEvent.rrule, dayjs(seededDate));

        setRepeatKind(seededRepeatKind);
        setCustomRule(seededCustomRule);
        setRecurrenceSessionId((n) => n + 1);

        const values = {
            title: targetEvent.title,
            startDate: seededDate,
            endDate: seededEndDate === seededDate ? '' : seededEndDate,
            allDay: targetEvent.hasTime === false,
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
        onClose();
    };

    const handleSave = async () => {
        const { hasErrors } = form.validate();
        if (hasErrors) return;

        const values = form.getValues();
        const tzid = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const hasTime = !values.allDay;
        const rrule = buildRRule(repeatKind, customRule, dayjs(values.startDate), hasTime);

        try {
            if (edit && event) {
                if (hasTime) {
                    const startLocal = combineLocalFromStrings(values.startDate, values.startTime);
                    const effectiveEndDate = values.endDate || values.startDate;
                    const endLocal = values.endTime
                        ? combineLocalFromStrings(effectiveEndDate, values.endTime)
                        : dayjs(startLocal).add(DEFAULT_EVENT_DURATION_HOURS, "hour").toDate();
                    await updateEvent({
                        id: event.id,
                        householdId,
                        title: values.title.trim(),
                        tzid,
                        startUtc: startLocal.toISOString(),
                        endUtc: endLocal.toISOString(),
                        rrule,
                        visibility: values.visibility,
                        allMembers: values.allMembers,
                        attendeeIds: values.assignedUserIds
                    }).unwrap();
                } else {
                    await updateEvent({
                        id: event.id,
                        householdId,
                        title: values.title.trim(),
                        tzid,
                        startUtc: toAllDayStartUtc(values.startDate, tzid),
                        endUtc: toAllDayEndUtc(values.endDate || values.startDate, tzid),
                        hasTime: false,
                        rrule,
                        visibility: values.visibility,
                        allMembers: values.allMembers,
                        attendeeIds: values.assignedUserIds
                    }).unwrap();
                }
            } else {
                if (hasTime) {
                    const startLocal = combineLocalFromStrings(values.startDate, values.startTime);
                    const effectiveEndDate = values.endDate || values.startDate;
                    const endLocal = values.endTime
                        ? combineLocalFromStrings(effectiveEndDate, values.endTime)
                        : dayjs(startLocal).add(DEFAULT_EVENT_DURATION_HOURS, "hour").toDate();
                    await createEvent({
                        householdId, title: values.title.trim(),
                        startUtc: startLocal.toISOString(),
                        endUtc: endLocal.toISOString(),
                        tzid,
                        rrule,
                        visibility: values.visibility,
                        allMembers: values.allMembers,
                        attendeeIds: values.assignedUserIds
                    }).unwrap();
                } else {
                    await createEvent({
                        householdId,
                        title: values.title.trim(),
                        startUtc: toAllDayStartUtc(values.startDate, tzid),
                        endUtc: toAllDayEndUtc(values.endDate || values.startDate, tzid),
                        hasTime: false,
                        tzid,
                        rrule,
                        visibility: values.visibility,
                        allMembers: values.allMembers,
                        attendeeIds: values.assignedUserIds
                    } as any).unwrap();
                }
            }
            onClose();
        } catch (e) {
            console.error(e);
        }
    };

    return (
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
    );
}