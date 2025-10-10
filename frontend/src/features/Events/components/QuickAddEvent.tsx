// QuickAddEvent.tsx (string-based DateInput + TimeInput)
import { useEffect, useState } from "react";
import { Modal, Button, TextInput, Group } from "@mantine/core";
import { DateInput, DatePickerInput, TimeInput } from "@mantine/dates";
import dayjs from "dayjs";
import { useCreateEventMutation } from "@/store/eventSlice";

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
    const [timeStr, setTimeStr] = useState<string>("09:00");
    const [createEvent, { isLoading }] = useCreateEventMutation();

    // Reset fields whenever modal opens or the clicked day changes
    useEffect(() => {
        if (opened) {
            setTitle("");
            setDateStr(dayjs(initialDate).format("YYYY-MM-DD"));
            setTimeStr("09:00");
        }
    }, [opened, initialDate]);

    const handleSave = async () => {
        if (!title.trim() || !dateStr || !timeStr) return;

        const startLocal = combineLocalFromStrings(dateStr, timeStr);
        const endLocal = dayjs(startLocal).add(1, "hour").toDate();
        const tzid = Intl.DateTimeFormat().resolvedOptions().timeZone;

        await createEvent({
            householdId,
            title: title.trim(),
            startUtc: startLocal.toISOString(),
            endUtc: endLocal.toISOString(),
            tzid,
        });

        onClose();
    };

    return (
        <Modal opened={opened} onClose={onClose} title="Add event" centered>
            <TextInput
                label="Title"
                placeholder="Dentist"
                value={title}
                onChange={(e) => setTitle(e.currentTarget.value)}
                required
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
                />
                <TimeInput
                    label="Time"
                    value={timeStr}                         // <-- string
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
