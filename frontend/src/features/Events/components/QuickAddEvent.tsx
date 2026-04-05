// QuickAddEvent.tsx
import { useEffect, useMemo, useState } from "react";
import { Modal, Button, TextInput, Group, Stack, Text } from "@mantine/core";
import { DatePickerInput, TimeInput } from "@mantine/dates";
import dayjs from "dayjs";
import { useCreateEventMutation, useDeleteEventMutation, useGetHouseholdEventsQuery, useUpdateEventMutation, type CalendarEvent } from "@/store/eventSlice";
import "../styles/QuickAddEvent.css"
import { useIsSmallScreen } from "@/hooks";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import { EventMenu } from "./EventMenu";
import { RemainingChars } from "@/components/RemainingChars";
import { ClockIcon } from "@/assets/icons/ClockIcon";
import { useModalFocus } from "@/hooks/useModalFocus";

function startEndIsoForLocalDay(ymd: string) {
    const [y, m, d] = ymd.split("-").map(Number);
    const start = new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { startIso: start.toISOString(), endIso: end.toISOString() };
}

function combineLocalFromStrings(dateStr: string, timeStr: string) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const [hh = "0", mm = "0"] = timeStr.split(":");
    return new Date(y, (m ?? 1) - 1, d ?? 1, Number(hh), Number(mm), 0, 0);
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

export function QuickAddEvent({
    householdId,
    opened,
    initialDate,
    onClose,
    edit,
    event
}: {
    householdId: number;
    opened: boolean;
    initialDate: Date;
    onClose: () => void;
    edit: boolean;
    event?: CalendarEvent;
}) {
    const isSmallScreen = useIsSmallScreen(425);
    const [createEvent, { isLoading: creating }] = useCreateEventMutation();
    const [updateEvent, { isLoading: updating }] = useUpdateEventMutation();
    const [deleteEvent] = useDeleteEventMutation();
    const { ref: nameRef, transitionProps } = useModalFocus(!edit);
    const isSaving = creating || updating;

    // Store the full editing event in state so it stays stable even if the date changes
    const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
    const isEditingRow = editingEvent !== null;

    const [title, setTitle] = useState(event?.title ?? "");
    const [dateStr, setDateStr] = useState(() =>
        event ? ymdFromIso(event.startUtc ?? undefined) : dayjs(initialDate).format("YYYY-MM-DD")
    );
    const [timeStr, setTimeStr] = useState<string>(() =>
        event ? (event.hasTime === false ? "" : hmFromIso(event.startUtc)) : ""
    );
    const [titleError, setTitleError] = useState("");
    const [dateError, setDateError] = useState("");

    const [remainingChars, setRemainingChars] = useState(100);

    useEffect(() => {
        setRemainingChars(100 - title.trim().length);
    }, [title])

    const { startIso, endIso } = useMemo(
        () => (dateStr ? startEndIsoForLocalDay(dateStr) : { startIso: "", endIso: "" }),
        [dateStr]
    );

    const { data: dayEvents = [], isLoading: loading } = useGetHouseholdEventsQuery(
        { householdId, startIso, endIso },
        { skip: !householdId || !dateStr }
    );

    const sorted = useMemo(() => {
        return [...dayEvents].sort((a, b) => {
            const aAll = a.hasTime === false;
            const bAll = b.hasTime === false;
            if (aAll !== bAll) return aAll ? -1 : 1;
            const ta = a.startUtc ? +new Date(a.startUtc) : 0;
            const tb = b.startUtc ? +new Date(b.startUtc) : 0;
            return ta - tb;
        });
    }, [dayEvents]);

    // Seed form when modal opens or external event changes
    useEffect(() => {
        if (!opened) return;
        if (event?.id) {
            setTitle(event.title);
            setDateStr(ymdFromIso(event.startUtc ?? undefined));
            setTimeStr(event.hasTime === false ? "" : hmFromIso(event.startUtc));
            setEditingEvent(event); // <- was null, now seeds the event so the row highlights
        } else {
            setTitle("");
            setDateStr(dayjs(initialDate).format("YYYY-MM-DD"));
            setTimeStr("");
            setEditingEvent(null);
        }
        setTitleError("");
        setDateError("");
    }, [opened, event?.id]);

    // Populate form when a row edit is triggered
    useEffect(() => {
        if (editingEvent) {
            setTitle(editingEvent.title);
            setDateStr(ymdFromIso(editingEvent.startUtc ?? undefined));
            setTimeStr(editingEvent.hasTime === false ? "" : hmFromIso(editingEvent.startUtc));
            setTitleError("");
            setDateError("");
        }
    }, [editingEvent?.id]);

    const resetToAddState = () => {
        setEditingEvent(null);
        setTitle("");
        setTimeStr("");
        setTitleError("");
        setDateError("");
    };

    const handleDeleteEvent = async (eventId: number) => {
        await deleteEvent({ id: eventId, householdId }).unwrap();
        if (editingEvent?.id === eventId) resetToAddState();
    };

    const handleClose = () => {
        onClose();
        setTitleError("");
    };

    const handleSave = async () => {
        setTitleError("");
        setDateError("");

        if (!title.trim()) setTitleError("Title required");
        if (!dateStr) setDateError("Date required");
        if (!title.trim() || !dateStr) return;

        const tzid = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const hasTime = Boolean(timeStr && timeStr.trim());

        try {
            if (isEditingRow && editingEvent) {
                // Inline row edit — editingEvent is stable even if date changed
                if (hasTime) {
                    const startLocal = combineLocalFromStrings(dateStr, timeStr);
                    const endLocal = dayjs(startLocal).add(1, "hour").toDate();
                    await updateEvent({
                        id: editingEvent.id,
                        householdId,
                        title: title.trim(),
                        tzid,
                        startUtc: startLocal.toISOString(),
                        endUtc: endLocal.toISOString(),
                    }).unwrap();
                } else {
                    await updateEvent({
                        id: editingEvent.id,
                        householdId,
                        title: title.trim(),
                        tzid,
                        date: dateStr,
                    }).unwrap();
                }
                resetToAddState();
            } else if (edit && event) {
                // External edit (opened with a pre-selected event)
                if (hasTime) {
                    const startLocal = combineLocalFromStrings(dateStr, timeStr);
                    const endLocal = dayjs(startLocal).add(1, "hour").toDate();
                    await updateEvent({
                        id: event.id,
                        householdId,
                        title: title.trim(),
                        tzid,
                        startUtc: startLocal.toISOString(),
                        endUtc: endLocal.toISOString(),
                    }).unwrap();
                } else {
                    await updateEvent({
                        id: event.id,
                        householdId,
                        title: title.trim(),
                        tzid,
                        date: dateStr,
                    }).unwrap();
                }
                onClose();
            } else {
                // Create
                if (hasTime) {
                    const startLocal = combineLocalFromStrings(dateStr, timeStr);
                    const endLocal = dayjs(startLocal).add(1, "hour").toDate();
                    await createEvent({
                        householdId,
                        title: title.trim(),
                        startUtc: startLocal.toISOString(),
                        endUtc: endLocal.toISOString(),
                        tzid,
                    }).unwrap();
                } else {
                    await createEvent({
                        householdId,
                        title: title.trim(),
                        date: dateStr,
                        tzid,
                    } as any).unwrap();
                }
                onClose();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const modalTitle = isEditingRow || (edit && event) ? "Edit event" : "Add event";

    return (
        <Modal transitionProps={transitionProps} opened={opened} onClose={handleClose} radius="md" title={modalTitle} centered keepMounted={false}>
            <TextInput
                ref={nameRef}
                label="Title"
                placeholder="ex: Dentist"
                value={title}
                onChange={(e) => setTitle(e.currentTarget.value)}
                required
                withErrorStyles
                maxLength={100}
            />
            <RemainingChars count={title.length} max={100} />
            {isSmallScreen ? <Stack gap="0.5rem"><DatePickerInput
                dropdownType={isSmallScreen ? "modal" : "popover"}
                placeholder="Select date"
                label="Date"
                value={dateStr}
                onChange={(v) => setDateStr(v ? dayjs(v).format("YYYY-MM-DD") : "")}
                required
                leftSection={<CalendarMonthRoundedIcon />}
                leftSectionWidth="40px"
                clearable
                color="rgb(5, 5, 73)"
                styles={DATE_PICKER_STYLES}
                presets={DATE_PRESETS}
                valueFormatter={({ date, format }: any) =>
                    date ? dayjs(date).format(format) : ""
                }
                firstDayOfWeek={0}
            />
                <TimeInput
                    leftSection={<ClockIcon color="rgb(5, 5, 73)" size="1.25rem" />}
                    label="Time"
                    value={timeStr}
                    onChange={(e) => setTimeStr(e.currentTarget.value)}
                /></Stack> : <Group grow>
                <DatePickerInput
                    dropdownType={isSmallScreen ? "modal" : "popover"}
                    placeholder="Select date"
                    label="Date"
                    value={dateStr}
                    onChange={(v) => setDateStr(v ? dayjs(v).format("YYYY-MM-DD") : "")}
                    required
                    leftSection={<CalendarMonthRoundedIcon />}
                    leftSectionWidth="40px"
                    clearable
                    color="rgb(5, 5, 73)"
                    styles={DATE_PICKER_STYLES}
                    presets={DATE_PRESETS}
                    valueFormatter={({ date, format }: any) =>
                        date ? dayjs(date).format(format) : ""
                    }
                    firstDayOfWeek={0}
                />
                <TimeInput
                    leftSection={<ClockIcon color="rgb(5, 5, 73)" size="1.25rem" />}
                    label="Time"
                    value={timeStr}
                    onChange={(e) => setTimeStr(e.currentTarget.value)}
                />
            </Group>}
            <Stack mt="lg" gap="xs">
                <div className="todays-events-container">
                    <div className="todays-events">
                        {sorted.length === 0 ? (
                            <div className="no-events">
                                <Text c="dimmed" size="sm">No events for this date.</Text>
                            </div>
                        ) : loading ? (
                            <Text size="sm">Loading...</Text>
                        ) : (
                            sorted.map((e) => (
                                <EventRow
                                    key={e.id}
                                    e={e}
                                    isEditing={editingEvent?.id === e.id}
                                    onEdit={setEditingEvent}
                                    onCancelEdit={resetToAddState}
                                    onDelete={handleDeleteEvent}
                                />
                            ))
                        )}
                    </div>
                </div>
            </Stack>
            <Group justify="flex-end" mt="lg">
                <Button h="auto" p=".5rem 1rem" size="sm" fw={500} color="rgb(5, 5, 73)" variant="outline" onClick={isEditingRow ? resetToAddState : handleClose}>Cancel</Button>
                <Button h="auto" p=".5rem 1rem" size="sm" fw={500} color="rgb(5, 5, 73)" loading={isSaving} onClick={handleSave} data-test="quickadd-submit" disabled={title.trim().length === 0 || dateStr.trim().length === 0}>
                    {isEditingRow ? "Update" : "Save"}
                </Button>
            </Group>
        </Modal>
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
    return (
        <div className={`event-row${isEditing ? " editing" : ""}`}>
            <Group gap="xs" wrap="nowrap" align="center">
                <Text size="12px" inline w={80} fw={400}>
                    {e.hasTime === false ? "All day" : (e.startUtc && fmtTime(e.startUtc)) || ""}
                </Text>
                <Group gap=".25rem" miw={0} wrap="nowrap" justify="space-between" w="100%">
                    <Text size="sm" inline c="var(--mantine-color-dark-7)" fw={500} truncate miw={0}>{e.title}</Text>
                    <EventMenu
                        isEditing={isEditing}
                        setIsEditing={(val) => val ? onEdit(e) : onCancelEdit()}
                        onDelete={() => onDelete(e.id)}
                    />
                </Group>
            </Group>
        </div>
    );
};
