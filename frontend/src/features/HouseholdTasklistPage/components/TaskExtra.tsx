import { useGetHouseholdQuery } from "@/store/householdSlice"
import { useGetTodoListQuery, useGetTodoQuery, type Todo } from "@/store/todoSlice"
import { useGetUserQuery } from "@/store/userSlice";
import { Avatar, Tooltip } from "@mantine/core";
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useNavigate } from "react-router-dom";

dayjs.extend(customParseFormat);

type Props = {
    todo: Todo
    householdId: number;
    listId: number;
}

export function relativeDayLabel(
    input: string | number | Date | undefined,              // accepts "YYYY-MM-DD" or a Date
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

export const TaskExtra = ({ todo, householdId, listId }: Props) => {
    const navigate = useNavigate();
    const { data: household } = useGetHouseholdQuery(householdId)
    const { data: todoList } = useGetTodoListQuery(listId)
    const membersList =
        household?.members
            .filter(m => todoList?.memberIds?.includes(m.id))
            .map(m => ({ id: m.id, name: m.name, img: m.profileImg })) ?? [];

    const assigned =
        todo.assignedToId != null
            ? membersList.find(m => m.id === todo.assignedToId) ?? null
            : null;
    console.log(assigned)

    const dateLabel =
        todo.dueDate
            ? dayjs(todo.dueDate, "YYYY-MM-DD", true).format("ddd, MMM D")
            : null;
    return <div className="task-extra">
        {assigned !== null && <div className="extra"><Tooltip key={assigned?.id} label={assigned?.name} withArrow>
            <Avatar style={{ cursor: "pointer" }} onClick={() => navigate(`/users/${assigned?.id}`)} size="xs" src={assigned?.img} alt={assigned?.name} />
        </Tooltip></div>}
        {dateLabel !== null && <div className="extra"><CalendarTodayRoundedIcon />{relativeDayLabel(todo?.dueDate)}</div>}
        {todo.notes !== "" && todo.notes !== null && <div className="extra"><TextSnippetIcon /> Notes </div>}
    </div>
}