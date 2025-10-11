// QuickAddEvent.tsx (string-based DateInput + TimeInput)
import { useEffect, useState } from "react";
import { Modal, Button, TextInput, Group } from "@mantine/core";
import { DateInput, DatePickerInput, TimeInput } from "@mantine/dates";
import dayjs from "dayjs";
import { useCreateEventMutation } from "@/store/eventSlice";
import "../styles/QuickAddEvent.css"

function combineLocalFromStrings(dateStr: string, timeStr: string) {
    // dateStr: "YYYY-MM-DD", timeStr: "HH:mm"
    const [y, m, d] = dateStr.split("-").map(Number);        // m is 1-based
    const [hh = "0", mm = "0"] = timeStr.split(":");
    return new Date(y, (m ?? 1) - 1, d ?? 1, Number(hh), Number(mm), 0, 0); // local time
}

export function QuickAddEvent({
    householdId,
    opened,
    initialDate,
    onClose,
}: {
    householdId: number;
    opened: boolean;
    initialDate: Date;
    onClose: () => void;
}) {
    const [title, setTitle] = useState("");
    const [dateStr, setDateStr] = useState<string>(dayjs(initialDate).format("YYYY-MM-DD"));
    const [timeStr, setTimeStr] = useState<string>("10:00");
    const [createEvent, { isLoading }] = useCreateEventMutation();
    const [titleError, setTitleError] = useState<string>("");
    const [dateError, setDateError] = useState<string>("");

    const handleClose = () => {
        onClose();
        setTitleError("");
    }

    // Reset fields whenever modal opens or the clicked day changes
    useEffect(() => {
        if (opened) {
            setTitle("");
            setDateStr(dayjs(initialDate).format("YYYY-MM-DD"));
            setTimeStr("");
        }
    }, [opened, initialDate]);

    const handleSave = async () => {
        setTitleError("");
        setDateError("");

        if (!title.trim()) setTitleError("Title required");
        if (!dateStr) setDateError("Date required");
        if (!title.trim() || !dateStr) return;

        const tzid = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const hasTime = Boolean(timeStr && timeStr.trim()); // <- user provided a time?

        try {
            if (hasTime) {
                // Timed event -> send startUtc/endUtc
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
                // Date-only event -> send date only
                await createEvent({
                    householdId,
                    title: title.trim(),
                    date: dateStr,  // "YYYY-MM-DD"
                    tzid,
                } as any).unwrap();
                // ^ if your mutation input is typed as a discriminated union, `as any`
                //   won’t be needed. (See prior message for the CreateEventInput union.)
            }

            onClose();
        } catch (e) {
            // optional: surface an error toast/message
            console.error(e);
        }
    };

    return (
        <Modal opened={opened} onClose={handleClose} title="Add event" centered>
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
                />
            </Group>
            <Group justify="flex-end" mt="lg">
                <Button color="cyan" variant="outline" onClick={onClose}>Cancel</Button>
                <Button color="cyan" loading={isLoading} onClick={handleSave}>Save</Button>
            </Group>
        </Modal>
    );
}
