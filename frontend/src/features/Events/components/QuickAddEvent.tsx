// QuickAddEvent.tsx (string-based DateInput + TimeInput)
import { useEffect, useMemo, useState } from "react";
import { Modal, Button, TextInput, Group, Stack, Text, Anchor, ScrollArea } from "@mantine/core";
import { DatePickerInput, TimeInput } from "@mantine/dates";
import dayjs from "dayjs";
import { useCreateEventMutation, useDeleteEventMutation, useGetHouseholdEventsQuery, useUpdateEventMutation, type CalendarEvent } from "@/store/eventSlice";
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import "../styles/QuickAddEvent.css"

function startEndIsoForLocalDay(ymd: string) {
    const [y, m, d] = ymd.split("-").map(Number);
    const start = new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1); // next day's midnight (local)
    return { startIso: start.toISOString(), endIso: end.toISOString() };
}

function combineLocalFromStrings(dateStr: string, timeStr: string) {
    // dateStr: "YYYY-MM-DD", timeStr: "HH:mm"
    const [y, m, d] = dateStr.split("-").map(Number);        // m is 1-based
    const [hh = "0", mm = "0"] = timeStr.split(":");
    return new Date(y, (m ?? 1) - 1, d ?? 1, Number(hh), Number(mm), 0, 0); // local time
}

const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

const ymdFromIso = (iso?: string | null, fallback = new Date()) =>
    dayjs(iso ?? fallback).format("YYYY-MM-DD");

const hmFromIso = (iso?: string | null) =>
    iso ? dayjs(iso).format("HH:mm") : "";

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
    const [createEvent, { isLoading: creating }] = useCreateEventMutation();
    const [updateEvent, { isLoading: updating }] = useUpdateEventMutation();
    const [deleteEvent] = useDeleteEventMutation();

    const isSaving = creating || updating;

    const [title, setTitle] = useState(event?.title ?? "");
    const [dateStr, setDateStr] = useState(() =>
        event ? ymdFromIso(event.startUtc ?? undefined) : dayjs(initialDate).format("YYYY-MM-DD")
    );
    const [timeStr, setTimeStr] = useState<string>(() =>
        event ? (event.hasTime === false ? "" : hmFromIso(event.startUtc)) : ""
    );
    const [titleError, setTitleError] = useState("");
    const [dateError, setDateError] = useState("");

    useEffect(() => {
        if (!opened) return;

        if (event?.id) {
            // editing a specific event
            setTitle(event.title);
            setDateStr(ymdFromIso(event.startUtc ?? undefined));
            setTimeStr(event.hasTime === false ? "" : hmFromIso(event.startUtc));
        } else {
            // add flow
            setTitle("");
            setDateStr(dayjs(initialDate).format("YYYY-MM-DD"));
            setTimeStr("");
        }
        setTitleError("");
        setDateError("");
        // only open/close & event id should trigger reseed
    }, [opened, event?.id]);

    const handleDeleteEvent = async (eventId: number) => {
        await deleteEvent({ id: eventId, householdId }).unwrap()
    }

    const handleClose = () => {
        onClose();
        setTitleError("");
    }

    const { startIso, endIso } = useMemo(
        () => (dateStr ? startEndIsoForLocalDay(dateStr) : { startIso: "", endIso: "" }),
        [dateStr]
    );

    const { data: dayEvents = [], isFetching: loading } = useGetHouseholdEventsQuery(
        { householdId, startIso, endIso },
        { skip: !householdId || !dateStr }
    );

    const sorted = useMemo(() => {
        return [...dayEvents].sort((a, b) => {
            // all-day (hasTime === false) first
            const aAll = a.hasTime === false;
            const bAll = b.hasTime === false;
            if (aAll !== bAll) return aAll ? -1 : 1;
            const ta = a.startUtc ? +new Date(a.startUtc) : 0;
            const tb = b.startUtc ? +new Date(b.startUtc) : 0;
            return ta - tb;
        });
    }, [dayEvents]);

    const handleSave = async () => {
        setTitleError("");
        setDateError("");

        if (!title.trim()) setTitleError("Title required");
        if (!dateStr) setDateError("Date required");
        if (!title.trim() || !dateStr) return;

        const tzid = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const hasTime = Boolean(timeStr && timeStr.trim());

        try {
            if (edit && event) {
                // ----- EDIT (PATCH) -----
                if (hasTime) {
                    // Timed: send BOTH startUtc and endUtc, and DO NOT send `date`
                    const startLocal = combineLocalFromStrings(dateStr, timeStr);
                    const endLocal = dayjs(startLocal).add(1, "hour").toDate();

                    const res = await updateEvent({
                        id: event.id,
                        householdId,
                        title: title.trim(),
                        tzid, // optional, but fine to include
                        startUtc: startLocal.toISOString(),
                        endUtc: endLocal.toISOString(),
                        // ❌ no `date` key here
                    }).unwrap();
                    setTitle(res.title);
                } else {
                    // All-day: send ONLY `date` (no startUtc/endUtc at all)
                    const res = await updateEvent({
                        id: event.id,
                        householdId,
                        title: title.trim(),
                        tzid,    // optional
                        date: dateStr, // "YYYY-MM-DD"
                        // ❌ do NOT include startUtc/endUtc (not even null/undefined)
                    }).unwrap();
                    setTitle(res.title);
                }
            } else {
                // ----- CREATE (your existing logic is fine) -----
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
            }
            onClose();
            return;
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <Modal opened={opened} onClose={handleClose} title={edit ? "Edit event" : "Add event"} centered keepMounted={false}>
            <TextInput
                label="Title"
                placeholder="Dentist"
                value={title}
                onChange={(e) => setTitle(e.currentTarget.value)}
                required
                error={titleError}
                withErrorStyles
            />
            <Group grow mt="md">
                <DatePickerInput
                    label="Date"
                    value={dateStr}                         // <-- string
                    onChange={(v) => setDateStr(v ?? "")}  // <-- expects string | null
                    required
                    styles={{
                        wrapper: { width: "100%", border: "1px solid var(--main-border)", borderRadius: "0.5rem" },
                        input: { fontWeight: "normal", fontFamily: "Nunito Sans, sans-serif", border: 0, width: "100%", borderRadius: "0.5rem", background: "var(--input-background)", color: "white" },
                        month: { background: "var(--main-background)", color: "white" },
                        day: { color: "white" },
                        calendarHeader: { background: "var(--main-background)", color: "white" },
                        presetsList: { background: "var(--main-background)", color: "white", borderColor: "var(--main-border)" },
                        datePickerRoot: { background: "var(--main-background)", borderRadius: "0.5rem" },
                        monthsListControl: { background: "var(--main-background)", color: "white" },
                        yearsListControl: { background: "var(--main-background)", color: "white" },
                        weekday: { color: "var(--sub-text)" },
                        placeholder: { color: "var(--sub-text)" }
                    }}
                    error={dateError}
                />
                <TimeInput
                    label="Time"
                    value={timeStr}
                    onChange={(e) => setTimeStr(e.currentTarget.value)}
                    styles={{
                        wrapper: { width: "100%", border: "1px solid var(--main-border)", borderRadius: "0.5rem" },
                        input: { fontWeight: "normal", fontFamily: "Nunito Sans, sans-serif", border: 0, width: "100%", borderRadius: "0.5rem", background: "var(--input-background)", color: "white" },
                    }}
                />
            </Group>
            <Stack mt="lg" gap="xs">
                <Text fw={400} c="white" styles={{ root: { fontFamily: "Alan Sans, sans-serif" } }}>Events</Text>
                {sorted.length > 0 && <Text c="white" inline size="xs">To edit an event, go to the <Anchor underline="always" href="" target="_blank" c="cyan.3">Events</Anchor> page.</Text>}
                <ScrollArea scrollbars="y" viewportProps={{ style: { maxHeight: 185 } }}>
                    {sorted.length === 0 ? (
                        <Text c="dimmed" size="sm">No events for this date.</Text>
                    ) : loading ? <Text size="sm" c="white">Loading...</Text> : (
                        sorted.map((e) => (
                            <Group key={e.id} gap="sm" wrap="nowrap">
                                <Text size="sm" inline w={80} fw={700} c="cyan.3">
                                    {e.hasTime === false ? "All day" : (e.startUtc && fmtTime(e.startUtc)) || ""}
                                </Text>
                                <Group justify="space-between" w="100%">
                                    <Text size="sm" inline c="white">{e.title}</Text>
                                    <div onClick={() => handleDeleteEvent(e.id)} className="delete-event-btn"><DeleteRoundedIcon /></div>
                                </Group>
                            </Group>
                        ))
                    )}
                </ScrollArea>
            </Stack>
            <Group justify="flex-end" mt="lg">
                <Button color="cyan" variant="outline" onClick={onClose}>Cancel</Button>
                <Button color="cyan" loading={isSaving} onClick={handleSave} data-test="quickadd-submit">
                    Save
                </Button>
            </Group>
        </Modal>
    );
}
