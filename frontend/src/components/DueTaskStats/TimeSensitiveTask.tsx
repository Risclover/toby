import { TaskExtra } from "@/features/HouseholdTasklists/components/HouseholdTasklistPage";
import type { OverdueTask, Task } from "@/store"
import { Badge, Checkbox, Pill, Text } from "@mantine/core"
import { useState } from "react"
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';
import dayjs from 'dayjs';
import { useNavigate } from "react-router-dom";

export function relativeDayLabel(
    input: string | Date | null | undefined,              // accepts "YYYY-MM-DD" or a Date
    fmt = "ddd, MMM D"
): "Today" | "Tomorrow" | "Yesterday" | string {
    const d = typeof input === "string"
        ? dayjs(input, "YYYY-MM-DD", true) // strict, date-only
        : dayjs(input);

    const today = dayjs().startOf("day");
    const diff = d.startOf("day").diff(today, "day");

    if (diff === 0) return "Today";
    if (diff === 1) return "Tomorrow";
    if (diff === -1) return "Yesterday";
    return d.format(fmt);               // fallback formatting
}

export const TimeSensitiveTask = ({ task, checked, onToggle }: {
    task: OverdueTask;
    checked: boolean;
    onToggle: (id: number) => void;
}) => {
    const navigate = useNavigate();
    return (
        <li className="time-sensitive-task">
            <div className="time-sensitive-task-info">
                <label>
                    <Checkbox
                        color="rgb(5, 5, 73)"
                        size="xs"
                        checked={checked}
                        onChange={() => onToggle(task.id)}
                    />
                    {task.title}
                </label>
            </div>
            <div className="sensitive-task-details">
                <div className="empty-space">&nbsp;</div>
                <div className="extra">
                    <span className="extra-label">{relativeDayLabel(task?.due_date)}</span>
                </div>

                <div className="reminder-separator-dot">·</div>
                <div className="extra extra--tasklist" onClick={() => window.open(`/tasklists/${task.tasklist_id}`, "_blank")}>
                    <div className="extra-label">{task.tasklist_title}</div>
                </div>
            </div>
        </li>
    )
}

