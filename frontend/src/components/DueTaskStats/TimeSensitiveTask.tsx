import { TaskExtra } from "@/features/HouseholdTasklists/components/HouseholdTasklistPage";
import type { OverdueTask, Task } from "@/store"
import { Badge, Checkbox, Pill, Text } from "@mantine/core"
import { useState } from "react"
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';
import dayjs from 'dayjs';
import { useNavigate } from "react-router-dom";
import { ExternalLinkIcon } from "@/assets/icons/ExternalLinkIcon";

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

type TaskItem = {
    id: number
    title: string
    due_date: string
    tasklist_id: number
    tasklist_title: string
}

type Props = {
    task: TaskItem
    checked: boolean
    onToggle: (id: number) => void
    tab: string
}

export const TimeSensitiveTask = ({ task, checked, onToggle, tab }: Props) => {
    const navigate = useNavigate();
    return (
        <li className="time-sensitive-task">
            <div className="time-sensitive-task-info">
                <label>
                    <Checkbox
                        color={tab === "overdue" ? "var(--mantine-color-red-7)" : tab === "due_today" ? "var(--mantine-color-orange-7)" : "var(--mantine-color-blue-7)"}
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
                <div className="extra extra--tasklist" style={{ color: tab === "overdue" ? "var(--mantine-color-red-7)" : tab === "due_today" ? "var(--mantine-color-orange-7)" : "var(--mantine-color-blue-7)" }} onClick={() => window.open(`/tasklists/${task.tasklist_id}`, "_blank")}>
                    <div className="extra-label">{task.tasklist_title}</div>
                    <ExternalLinkIcon size=".8rem" color={tab === "overdue" ? "var(--mantine-color-red-7)" : tab === "due_today" ? "var(--mantine-color-orange-7)" : "var(--mantine-color-blue-7)"} />
                </div>
            </div>
        </li>
    )
}

