import { useEffect, useMemo, useRef, useState } from "react";
import { Modal, Button, TextInput, Group, Stack, Text, useModalsStack, getDefaultZIndex, Checkbox, Select, SegmentedControl, Input, Switch, Avatar, type MultiSelectProps, MultiSelect, InputWrapper } from "@mantine/core";
import { DatePickerInput, DateTimePicker, TimeInput, TimePicker, type DateFormatter } from "@mantine/dates";
import dayjs, { Dayjs } from "dayjs";
import { useCreateEventMutation, useDeleteEventMutation, useGetHouseholdEventsQuery, useUpdateEventMutation, type CalendarEvent } from "@/store/eventSlice";
import "../../styles/QuickAddEvent.css";
import { useHousehold, useIsSmallScreen } from "@/hooks";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import { EventMenu } from "../EventMenu";
import { RemainingChars } from "@/components/RemainingChars";
import { ClockIcon } from "@/assets/icons/ClockIcon";
import { useModalFocus } from "@/hooks/useModalFocus";
import { useAuthenticateQuery, useGetUserSettingsQuery } from "@/store";
import { EventFormRepeat } from "./Recurrence/EventFormRepeat";
import { EventFormRepeatCustom } from "./Recurrence/EventFormRepeatCustom";
import { buildRRule, matchingPresetKind, type CustomRecurrenceRule, type PresetKind } from "../../utils/recurrence";
import { useEventForm, type EventFormValues } from "../../hooks/useEventForm";
import customParseFormat from 'dayjs/plugin/customParseFormat';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useId } from "@mantine/hooks";
import { EventsModal } from "../EventsModal/EventsModal";
dayjs.extend(customParseFormat);

function combineLocalFromStrings(dateStr: string, timeStr: string) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const [hh = "0", mm = "0"] = timeStr.split(":");
    return new Date(y, (m ?? 1) - 1, d ?? 1, Number(hh), Number(mm), 0, 0);
}

function startEndIsoForLocalDay(ymd: string) {
    const [y, m, d] = ymd.split("-").map(Number);
    const start = new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { startIso: start.toISOString(), endIso: end.toISOString() };
}

const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

const ymdFromIso = (iso?: string | null, fallback = new Date()) =>
    dayjs(iso ?? fallback).format("YYYY-MM-DD");

const hmFromIso = (iso?: string | null) =>
    iso ? dayjs(iso).format("HH:mm") : "";

const DATE_PICKER_STYLES = {
    section: { color: "rgb(5, 5, 73)" },
    day: {
        "&[data-weekend]": { color: "#4e0202" },
        "&[data-selected], &[data-selected]:hover": {
            backgroundColor: "#2563eb",
            color: "white",
        },
    },
};

const DATE_PRESETS = [
    { value: dayjs().format("YYYY-MM-DD HH:mm:ss"), label: "Today" },
    { value: dayjs().add(1, "day").format("YYYY-MM-DD HH:mm:ss"), label: "Tomorrow" },
    { value: dayjs().add(1, "week").format("YYYY-MM-DD HH:mm:ss"), label: "Next week" },
    { value: dayjs().add(1, "month").format("YYYY-MM-DD HH:mm:ss"), label: "Next month" },
];
const TITLE_MAX_LENGTH = 100;
const DEFAULT_EVENT_DURATION_HOURS = 1;
const TIME_FORMAT = 'HH:mm'; // 'HH:mm:ss' if TimeInput has withSeconds
const THIRTY_MIN_MS = 30 * 60 * 1000;

type ModalId = 'recurrence' | 'event-form' | 'events-list';

export function EventForm({
    householdId,
    opened,
    initialDate,
    onClose,
    edit,
    event,
    stack
}: {
    householdId: number;
    opened: boolean;
    initialDate: Date;
    onClose: () => void;
    edit: boolean;
    event?: CalendarEvent;
    stack?: ReturnType<typeof useModalsStack<ModalId>>;
}) {
    const isSmallScreen = useIsSmallScreen(475);
    const [createEvent, { isLoading: creating }] = useCreateEventMutation();
    const [updateEvent, { isLoading: updating }] = useUpdateEventMutation();
    const [deleteEvent] = useDeleteEventMutation();
    const { ref: nameRef, transitionProps } = useModalFocus(!edit);
    const isSaving = creating || updating;
    const [repeatKind, setRepeatKind] = useState<PresetKind | 'custom'>('none');
    const [customRule, setCustomRule] = useState<CustomRecurrenceRule | null>(null);
    const { data: user } = useAuthenticateQuery();
    const { data: household } = useHousehold();
    const { data: userSettings } = useGetUserSettingsQuery(user.id);

    const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
    const isEditingRow = editingEvent !== null;
    const [recurrenceSessionId, setRecurrenceSessionId] = useState(0);
    const { form, allDay, startDate, title } = useEventForm({
        currentUserId: user.id,
        startDate: event ? ymdFromIso(event.startUtc ?? undefined) : dayjs(initialDate).format("YYYY-MM-DD"),
    });
    const lastEnteredStartTimeRef = useRef(form.getValues().startTime);
    const lastEnteredEndTimeRef = useRef(form.getValues().endTime);
    const titleId = useId();
    const allHouseholdMemberIds = useMemo(
        () => household?.members?.map((m: { id: number }) => m.id) ?? [],
        [household]
    );

    const memberOptions = useMemo(
        () => household?.members?.map((member: { id: number; firstName: string; lastName: string }) => ({
            value: String(member.id),
            label: `${member.firstName} ${member.lastName}`,
        })) ?? [],
        [household]
    );

    const memberAvatars = useMemo(() => Object.fromEntries(
        household?.members?.map((member: { id: number; profileImg?: string | null }) => [String(member.id), member.profileImg]) ?? []
    ), [household]);

    const renderMultiSelectOption: MultiSelectProps["renderOption"] = ({ option }) => (
        <Group gap="sm">
            <Avatar src={memberAvatars[option.value]} size="sm" radius="xl" />
            <Text size="sm">{option.label}</Text>
        </Group>
    );

    const handleMemberChange = (values: string[]) => {
        const ids = values.map(Number);
        form.setFieldValue('assignedUserIds', ids);
        form.setFieldValue('allMembers', ids.length > 0 && ids.length === allHouseholdMemberIds.length);
        form.validate();
    };

    const handleToggleAllMembers = (checked: boolean) => {
        form.setFieldValue('allMembers', checked);
        form.setFieldValue('assignedUserIds', checked ? allHouseholdMemberIds : []);
        form.validate();
    };

    // The only place customRule and repeatKind should ever be updated
    // together, in response to an actual Save in the custom recurrence
    // modal -- not reactively (see the comment left in EventFormRepeat.tsx
    // where the old useEffect used to live). If the freshly-saved rule
    // happens to be identical to one of the plain presets, activate that
    // preset instead of 'custom' -- same as the old effect's behavior,
    // just no longer re-run on every remount.
    const handleApplyCustomRule = (rule: CustomRecurrenceRule) => {
        setCustomRule(rule);
        const preset = matchingPresetKind(rule, dayjs(startDate));
        setRepeatKind(preset ?? 'custom');
    };

    const { startIso, endIso } = useMemo(
        () => (startDate ? startEndIsoForLocalDay(startDate) : { startIso: "", endIso: "" }),
        [startDate]
    );

    const { data: dayEvents = [], isLoading: loading } = useGetHouseholdEventsQuery(
        { householdId, startIso, endIso },
        { skip: !householdId || !startDate }
    );

    const sorted = useMemo(() => {
        return [...dayEvents].sort((a: CalendarEvent, b: CalendarEvent) => {
            const aAll = a.hasTime === false;
            const bAll = b.hasTime === false;
            if (aAll !== bAll) return aAll ? -1 : 1;
            const ta = a.startUtc ? +new Date(a.startUtc) : 0;
            const tb = b.startUtc ? +new Date(b.startUtc) : 0;
            return ta - tb;
        });
    }, [dayEvents]);

    // Establishes a NEW baseline for this modal instance -- call whenever
    // it should represent a fresh, blank add for the given date.
    const seedBlank = (seededDate: string) => {
        setEditingEvent(null);
        setRepeatKind('none');
        setCustomRule(null);
        setRecurrenceSessionId((n) => n + 1);

        const defaultStartTime = roundUpToNearest30Min(dayjs());
        const defaultEndTime = defaultStartTime.add(DEFAULT_EVENT_DURATION_HOURS, 'hour');

        const values = {
            title: '',
            startDate: seededDate,
            endDate: '',
            allDay: true,
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
    };

    // Establishes a NEW baseline representing an existing event -- used
    // both for the externally-passed `event` prop and for clicking "edit"
    // on one of the day's other events in the list below.
    const seedFromEvent = (targetEvent: CalendarEvent) => {
        const seededDate = ymdFromIso(targetEvent.startUtc ?? undefined);
        const seededTime = targetEvent.hasTime === false ? "" : hmFromIso(targetEvent.startUtc);
        setEditingEvent(targetEvent);
        setRepeatKind('none'); // TODO: seed from targetEvent.rrule once parsing exists
        setCustomRule(null);
        setRecurrenceSessionId((n) => n + 1);
        const values = {
            title: targetEvent.title,
            startDate: seededDate,
            endDate: '',
            allDay: targetEvent.hasTime === false,
            startTime: seededTime,
            endTime: '',
            visibility: targetEvent.visibility,
            assignedUserIds: targetEvent.attendeeIds ?? [user.id],
            allMembers: targetEvent.allMembers
        };
        form.setValues(values);
        form.setInitialValues(values);
    };


    useEffect(() => {
        if (!opened) return;
        if (event?.id) {
            seedFromEvent(event);
        } else {
            seedBlank(dayjs(initialDate).format("YYYY-MM-DD"));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [opened, event?.id, initialDate.getTime()]);

    const handleDeleteEvent = async (eventId: number) => {
        await deleteEvent({ id: eventId, householdId }).unwrap();
        if (editingEvent?.id === eventId) seedBlank(dayjs(initialDate).format("YYYY-MM-DD"));
    };

    const handleClose = () => {
        stack?.closeAll();
        form.reset();
        setRepeatKind('none');
        setCustomRule(null);
        // Without this, `opened` never flips back to false, so clicking
        // the same day again after closing without saving wouldn't
        // re-trigger the seeding effect -- the form would show whatever
        // was left over from the abandoned edit instead of a fresh blank.
        onClose();
    };

    // Mantine's validateInputOnChange only re-applies the CHANGED field's
    // own error, not the whole errors object -- so a cross-field rule
    // (e.g. "end time can't be before start time") never gets cleared by
    // editing the *other* side of the relationship unless something forces
    // a full revalidation. Wrap onChange to do that explicitly, for any
    // field involved in one of these relationships.
    const validateOnChange = <Key extends keyof EventFormValues>(
        path: Key,
        options?: Parameters<typeof form.getInputProps>[1]
    ) => (value: any) => {
        form.getInputProps(path, options).onChange(value);
        form.validate();
    };

    const handleSave = async () => {
        const { hasErrors } = form.validate();
        if (hasErrors) return;

        const values = form.getValues();
        const tzid = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const hasTime = !values.allDay;
        const rrule = buildRRule(repeatKind, customRule, dayjs(values.startDate), hasTime) ?? undefined;

        try {
            if (isEditingRow && editingEvent) {
                if (hasTime) {
                    const startLocal = combineLocalFromStrings(values.startDate, values.startTime);
                    // Use the picked end date/time if there is one; fall back
                    // to the old start+1hr default only when no end date was
                    // ever set. If an end date was picked but no end time,
                    // reuse the start time (same clock time, later date) --
                    // flag if you want that to default to something else.
                    const endLocal = values.endDate
                        ? combineLocalFromStrings(values.endDate, values.endTime || values.startTime)
                        : dayjs(startLocal).add(DEFAULT_EVENT_DURATION_HOURS, "hour").toDate();
                    await updateEvent({
                        id: editingEvent.id, householdId, title: values.title.trim(), tzid,
                        startUtc: startLocal.toISOString(), endUtc: endLocal.toISOString(), rrule,
                        visibility: values.visibility, allMembers: values.allMembers, attendeeIds: values.assignedUserIds
                    }).unwrap();
                } else {
                    // NOTE: values.endDate is NOT sent here -- the backend's
                    // compute_allday_utc_bounds only accepts a single date,
                    // so a multi-day all-day span isn't representable yet
                    // without a backend change. allDay also isn't wired to
                    // any checkbox in the UI yet, so this branch won't
                    // actually run until that's added.
                    await updateEvent({
                        id: editingEvent.id, householdId, title: values.title.trim(), tzid, date: values.startDate, rrule, visibility: values.visibility,
                        allMembers: values.allMembers, attendeeIds: values.assignedUserIds
                    }).unwrap();
                }
                seedBlank(dayjs(initialDate).format("YYYY-MM-DD"));
            } else if (edit && event) {
                if (hasTime) {
                    const startLocal = combineLocalFromStrings(values.startDate, values.startTime);
                    // Use the picked end date/time if there is one; fall back
                    // to the old start+1hr default only when no end date was
                    // ever set. If an end date was picked but no end time,
                    // reuse the start time (same clock time, later date) --
                    // flag if you want that to default to something else.
                    const endLocal = values.endDate
                        ? combineLocalFromStrings(values.endDate, values.endTime || values.startTime)
                        : dayjs(startLocal).add(DEFAULT_EVENT_DURATION_HOURS, "hour").toDate();
                    await updateEvent({
                        id: event.id, householdId, title: values.title.trim(), tzid,
                        startUtc: startLocal.toISOString(), endUtc: endLocal.toISOString(), rrule,
                        visibility: values.visibility, allMembers: values.allMembers, attendeeIds: values.assignedUserIds
                    }).unwrap();
                } else {
                    // NOTE: values.endDate is NOT sent here -- see comment
                    // in the isEditingRow branch above.
                    await updateEvent({
                        id: event.id, householdId, title: values.title.trim(), tzid, date: values.startDate, rrule,
                        visibility: values.visibility, allMembers: values.allMembers, attendeeIds: values.assignedUserIds
                    }).unwrap();
                }
                onClose();
            } else {
                if (hasTime) {
                    const startLocal = combineLocalFromStrings(values.startDate, values.startTime);
                    // Use the picked end date/time if there is one; fall back
                    // to the old start+1hr default only when no end date was
                    // ever set. If an end date was picked but no end time,
                    // reuse the start time (same clock time, later date) --
                    // flag if you want that to default to something else.
                    const endLocal = values.endDate
                        ? combineLocalFromStrings(values.endDate, values.endTime || values.startTime)
                        : dayjs(startLocal).add(DEFAULT_EVENT_DURATION_HOURS, "hour").toDate();
                    await createEvent({
                        householdId, title: values.title.trim(),
                        startUtc: startLocal.toISOString(), endUtc: endLocal.toISOString(), tzid, rrule,
                        visibility: values.visibility, allMembers: values.allMembers, attendeeIds: values.assignedUserIds
                    }).unwrap();
                } else {
                    // NOTE: values.endDate is NOT sent here -- see comment
                    // in the isEditingRow branch above.
                    await createEvent({
                        householdId, title: values.title.trim(), date: values.startDate, tzid, rrule,
                        visibility: values.visibility, allMembers: values.allMembers, attendeeIds: values.assignedUserIds
                    } as any).unwrap();
                }
                onClose();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const modalTitle = isEditingRow || (edit && event) ? "Edit event" : "Add event";

    // stack?.register(...) returns undefined when this EventForm isn't
    // rendered inside a Modal.Stack (e.g. from UpcomingThisWeek, which has
    // no stack at all) -- spreading that straight into <Modal> left `opened`
    // unset in that case, but ModalProps.opened is required, not optional.
    // Fall back to the component's own `opened` prop whenever there's no
    // stack registration to pull it from.
    const eventFormStackProps = stack?.register('event-form');

    const roundUpToNearest30Min = (time: Dayjs): Dayjs => {
        const msSinceMidnight = time.diff(time.startOf('day'));
        const roundedMs = Math.ceil(msSinceMidnight / THIRTY_MIN_MS) * THIRTY_MIN_MS;
        return time.startOf('day').add(roundedMs, 'millisecond');
    };

    // Computed once, used to seed the form's initial values
    const defaultStartTime = roundUpToNearest30Min(dayjs());
    const defaultEndTime = defaultStartTime.add(DEFAULT_EVENT_DURATION_HOURS, 'hour');


    const handleStartTimeChange = (value: string) => {
        form.setFieldValue('startTime', value);

        if (value) {
            const newEndTime = dayjs(value, TIME_FORMAT)
                .add(DEFAULT_EVENT_DURATION_HOURS, 'hour')
                .format(TIME_FORMAT);
            form.setFieldValue('endTime', newEndTime);
        }

        form.validate();
    };

    const handleEndTimeChange = (value: string) => {
        form.setFieldValue('endTime', value);
        form.validate();
    };

    const handleStartTimeBlur = () => {
        if (!form.getValues().startTime) {
            form.setFieldValue('startTime', lastEnteredStartTimeRef.current);
        }
    };

    const handleEndTimeBlur = () => {
        if (!form.getValues().endTime) {
            form.setFieldValue('endTime', lastEnteredEndTimeRef.current);
        }
    };
    const dateRangeValue: [string | null, string | null] = [
        form.getValues().startDate || null,
        form.getValues().endDate || null,
    ];

    const handleDateRangeChange = ([a, b]: [string | null, string | null]) => {
        if (!a) {
            form.setFieldValue('startDate', '');
            form.setFieldValue('endDate', '');
        } else if (!b) {
            form.setFieldValue('startDate', a);
            form.setFieldValue('endDate', '');
        } else {
            const [earlier, later] = a <= b ? [a, b] : [b, a];
            form.setFieldValue('startDate', earlier);
            form.setFieldValue('endDate', earlier === later ? '' : later);
        }
        form.validate();
    };

    const formatDateRangeValue: DateFormatter = ({ type, date, locale, format }) => {
        if (type !== 'range' || !Array.isArray(date)) return '';

        const [start, end] = date;
        if (!start) return '';

        const startLabel = dayjs(start).locale(locale).format(format);
        if (!end || dayjs(end).isSame(start, 'day')) {
            return startLabel;
        }

        return `${startLabel} \u2013 ${dayjs(end).locale(locale).format(format)}`;
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
                    // keepMounted MUST be true, not false. Opening the
                    // Custom recurrence modal closes this modal via
                    // stack.close('event-form') (see toggleStack in
                    // EventFormRepeat), and reopens it via
                    // stack.open('event-form') on both Save and Cancel
                    // (see EventFormRepeatCustom). With keepMounted=false,
                    // that close/reopen actually unmounts and remounts
                    // everything in this modal's body -- including
                    // EventFormRepeat, whose useEffect re-derives
                    // repeatKind from customRule on every mount (not just
                    // when customRule changes, since mount-time effects
                    // always run regardless of the dependency array).
                    // Since customRule is deliberately kept around after
                    // switching to a preset (so it stays selectable in the
                    // dropdown), that remount was silently overwriting
                    // whatever preset you'd actually picked back to
                    // 'custom' every time you opened Custom and hit
                    // Cancel -- verified via a real Mantine Modal mounted
                    // in a jsdom sandbox: keepMounted=false measurably
                    // unmounts+remounts children across an opened
                    // false->true cycle, keepMounted=true does not.
                    keepMounted
                    fullScreen={isSmallScreen}
                    styles={{
                        body: { display: "flex", flexDirection: "column", height: "100%", padding: 0, overflow: "hidden" },
                        content: { overflow: "hidden", maxHeight: "100%", display: "flex", flexDirection: "column" },
                    }}
                >
                    <div className="event-form-modal--body">
                        <div>
                            <TextInput
                                {...form.getInputProps('title')}
                                error={!!form.errors.title}
                                key={form.key('title')}
                                ref={nameRef}
                                label="Title"
                                placeholder="ex: Dentist"
                                required
                                maxLength={TITLE_MAX_LENGTH}
                            />
                            <div className="event-form-input--error-container">
                                <div className="event-form-input--error">{form.errors.title}</div>
                                <div className="event-form-input--error-right">
                                    <RemainingChars count={title.length} max={TITLE_MAX_LENGTH} />
                                </div>
                            </div>
                        </div>
                        <Stack gap="md">
                            <div>
                                <Stack gap="sm">
                                    <Group grow align="flex-start">
                                        <DatePickerInput
                                            type="range"
                                            allowSingleDateInRange
                                            value={dateRangeValue}
                                            onChange={handleDateRangeChange}
                                            dropdownType={isSmallScreen ? "modal" : "popover"}
                                            modalProps={{ zIndex: getDefaultZIndex('popover') }}
                                            placeholder="Select event date(s)"
                                            label="Date"
                                            description="Select a single date, or create a range (start and end dates)."
                                            required
                                            leftSection={<CalendarMonthRoundedIcon />}
                                            leftSectionWidth="40px"
                                            color="rgb(5, 5, 73)"
                                            styles={DATE_PICKER_STYLES}
                                            firstDayOfWeek={0}
                                            clearable={!!form.getValues().endDate}
                                            valueFormatter={formatDateRangeValue}
                                        />
                                    </Group>
                                    <Checkbox
                                        {...form.getInputProps('allDay', { type: 'checkbox' })}
                                        key={form.key('allDay')}
                                        label="All Day"
                                        onChange={validateOnChange('allDay', { type: 'checkbox' })}
                                        color="rgb(5, 5, 73)"
                                    />
                                    {!form.getValues().allDay &&
                                        <Group grow align="flex-start">
                                            {/* <TimeInput
                                            {...form.getInputProps('startTime')}
                                            key={form.key('startTime')}
                                            leftSection={<ClockIcon color="rgb(5, 5, 73)" size="1.25rem" />}
                                            label="Start Time"
                                            disabled={form.getValues().allDay}
                                            required={!form.getValues().allDay}
                                            onChange={handleStartTimeChange}
                                            onBlur={handleStartTimeBlur}
                                        />
                                        <TimeInput
                                            {...form.getInputProps('endTime')}
                                            key={form.key('endTime')}
                                            leftSection={<ClockIcon color="rgb(5, 5, 73)" size="1.25rem" />}
                                            label="End Time"
                                            onChange={handleEndTimeChange}
                                            onBlur={handleEndTimeBlur}
                                            disabled={form.getValues().allDay}
                                        />
                                        <DatePickerInput
                                            type="range"
                                            allowSingleDateInRange
                                            clearable
                                        />a */}
                                            <TimePicker
                                                {...form.getInputProps('startTime')}
                                                key={form.key('startTime')}
                                                leftSection={<ClockIcon color="rgb(5, 5, 73)" size="1.25rem" />}
                                                label="Start time"
                                                disabled={form.getValues().allDay}
                                                required={!form.getValues().allDay}
                                                onChange={handleStartTimeChange}
                                                withDropdown
                                                minutesStep={15}
                                                hoursStep={1}
                                                format="12h"
                                            />
                                            <TimePicker
                                                {...form.getInputProps('endTime')}
                                                key={form.key('endTime')}
                                                leftSection={<ClockIcon color="rgb(5, 5, 73)" size="1.25rem" />}
                                                label="End Time"
                                                required={!form.getValues().allDay}
                                                onChange={handleEndTimeChange}
                                                disabled={form.getValues().allDay}
                                                withDropdown
                                                minutesStep={15}
                                                hoursStep={1}
                                                format="12h"
                                            />
                                        </Group>
                                    }
                                </Stack>
                            </div>
                            <EventFormRepeat
                                dateValue={startDate}
                                stack={stack}
                                customRule={customRule}
                                repeatKind={repeatKind}
                                onRepeatKindChange={setRepeatKind}
                            />
                            <Select
                                {...form.getInputProps('visibility')}
                                key={form.key('visibility')}
                                data={[{ value: "public", label: "Public" }, { value: "private", label: "Private" }]}
                                allowDeselect={false}
                                label="Visibility"
                                leftSection={form.getValues().visibility === "public" ? <VisibilityRoundedIcon style={{ fill: "rgb(5, 5, 73)" }} /> : <VisibilityOffIcon style={{ fill: "rgb(5, 5, 73)" }} />}
                                leftSectionWidth="40px"
                            />
                            {(household?.members?.length ?? 0) > 1 && (
                                <div className="event-form-repeat-custom--vertical-section">
                                    {/* {form.errors.assignedUserIds && (
                                    <Text size="xs" c="red">{form.errors.assignedUserIds}</Text>
                                    )} */}
                                    <InputWrapper>
                                        <Stack gap="xs">
                                            <div>
                                                <Stack gap={0}>
                                                    <Input.Label required htmlFor={titleId}>Assigned members</Input.Label>
                                                    <span className="event-form-input--error">{form.errors.assignedUserIds}</span>
                                                    <MultiSelect
                                                        id={titleId}
                                                        data={memberOptions}
                                                        value={form.getValues().assignedUserIds.map(String)}
                                                        onChange={handleMemberChange}
                                                        renderOption={renderMultiSelectOption}
                                                        maxDropdownHeight={300}
                                                        placeholder="Assign members"
                                                        hidePickedOptions
                                                        clearable
                                                        c="black"
                                                    />
                                                </Stack>
                                            </div>
                                            <Checkbox
                                                label="All members"
                                                checked={form.getValues().allMembers}
                                                onChange={(e) => handleToggleAllMembers(e.currentTarget.checked)}
                                                color="rgb(5, 5, 73)"
                                                size="sm"
                                            />
                                        </Stack>
                                    </InputWrapper>
                                </div>
                            )}
                        </Stack>
                        {/* <Stack mt="lg" gap="xs">
                            <div className="todays-events-container">
                                <div className="todays-events">
                                    {sorted.length === 0 ? (
                                        <div className="no-events">
                                            <Text c="dimmed" size="sm">No events for this date.</Text>
                                        </div>
                                    ) : loading ? (
                                        <Text size="sm">Loading...</Text>
                                    ) : (
                                        sorted.map((e: CalendarEvent) => (
                                            <EventRow
                                                key={e.id}
                                                e={e}
                                                isEditing={editingEvent?.id === e.id}
                                                onEdit={seedFromEvent}
                                                onCancelEdit={() => seedBlank(dayjs(initialDate).format("YYYY-MM-DD"))}
                                                onDelete={handleDeleteEvent}
                                            />
                                        ))
                                    )}
                                </div>
                            </div>
                        </Stack> */}
                    </div>
                    <Modal.Header component={'footer'} pos={'sticky'} bottom={0} style={{ borderRadius: 0 }}>
                        <Group w="100%" justify="flex-end">
                            <Button h="auto" p=".5rem 1rem" size="sm" fw={500} radius="sm" color="rgb(5, 5, 73)" variant="outline" onClick={isEditingRow ? () => seedBlank(dayjs(initialDate).format("YYYY-MM-DD")) : handleClose}>Cancel</Button>
                            <Button h="auto" p=".5rem 1rem" size="sm" fw={500} radius="sm" color="rgb(5, 5, 73)" loading={isSaving} onClick={handleSave} data-test="quickadd-submit" disabled={!form.isValid()}>
                                {isEditingRow ? "Update" : "Save"}
                            </Button>
                        </Group>
                    </Modal.Header>
                </Modal>
            </Modal.Stack >
            <Modal.Stack>
                <EventFormRepeatCustom key={recurrenceSessionId} stack={stack} dateStr={startDate} onApply={handleApplyCustomRule} />
            </Modal.Stack>
            <Modal.Stack>
                <EventsModal stack={stack} />
            </Modal.Stack>
        </>
    );
}

const EventRow = ({
    e,
    isEditing,
    onEdit,
    onCancelEdit,
    onDelete,
}: {
    e: CalendarEvent;
    isEditing: boolean;
    onEdit: (event: CalendarEvent) => void;
    onCancelEdit: () => void;
    onDelete: (id: number) => void;
}) => {
    const { data: currentUser } = useAuthenticateQuery();
    return (
        <div className={`event-row${isEditing ? " editing" : ""}`}>
            <Group gap="xs" wrap="nowrap" align="center">
                <Text size="12px" inline w={80} fw={400}>
                    {e.hasTime === false ? "All day" : (e.startUtc && fmtTime(e.startUtc)) || ""}
                </Text>
                <Group gap=".25rem" miw={0} wrap="nowrap" justify="space-between" w="100%">
                    <Text size="sm" inline c="var(--mantine-color-dark-7)" fw={500} truncate miw={0}>{e.title}</Text>
                    {(e.household.adminId === currentUser.id || e.creatorId === currentUser.id) && <EventMenu
                        isEditing={isEditing}
                        setIsEditing={(val: boolean) => val ? onEdit(e) : onCancelEdit()}
                        onDelete={() => onDelete(e.id)}
                    />}
                </Group>
            </Group>
        </div>
    );
};
