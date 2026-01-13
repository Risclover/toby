import { useGetHouseholdQuery } from "@/store/householdSlice";
import { useGetTodoListQuery, useUpdateTodoMutation } from "@/store/todoSlice";
import dayjs from "dayjs";
import { useState, type ChangeEventHandler } from "react";

type Member = {
    id: number;
    firstName: string;
    profileImg: string | null;
}

type Props = {
    taskId: number;
    listId: number;
    householdId: number;
    close: () => void;
}

export const useTaskDetails = ({ taskId, listId, householdId, close }: Props) => {
    // Mutations
    const [updateTodo] = useUpdateTodoMutation();

    // Queries 
    const { data: household } = useGetHouseholdQuery(householdId);
    const { data: todoList } = useGetTodoListQuery(listId);
    const { task } = useGetTodoListQuery(listId, {
        selectFromResult: ({ data }) => ({
            task: data?.todos?.find(t => t.id === taskId),
        }),
    })

    // Local state
    const [taskTitle, setTaskTitle] = useState<string>(task?.title ?? "");
    const [assignedTo, setAssignedTo] = useState<string | null>(String(task?.assignedToId));
    const [dateValue, setDateValue] = useState<string | Date | undefined | null>(task?.dueDate);
    const [taskNote, setTaskNote] = useState<string>(task?.notes ?? "");
    const [taskError, setTaskError] = useState<string>("");
    const [showTaskDeletion, setShowTaskDeletion] = useState<boolean>(false);

    // Derived data
    const membersList =
        household?.members
            ?.filter((m: Member) => todoList?.memberIds?.includes(m.id))
            .map((m: Member) => ({ id: m.id, firstName: m.firstName, profileImg: m.profileImg }))
        ?? [];

    const data = membersList.map((m: Member) => ({
        value: String(m.id),
        label: m.firstName,
        profileImg: m.profileImg, // keep raw data for renderOption
    }));

    const selected = data.find((d: { value: string | null; }) => d.value === assignedTo) || null;

    let taskDate = new Date(task?.createdAt ?? new Date());
    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' } as const;

    // Handlers
    const handleUpdateTitle = async (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (!task) return;
        setTaskTitle(event.target.value);
    };

    const handleUpdateDueDate = (val: string | Date | null | undefined) => {
        const dueDate: string | null = val == null ? null : typeof val === "string" ? val.slice(0, 10) : dayjs(val).format("YYYY-MM-DD");

        setDateValue(dueDate);
    };

    const handleUpdateAssignedTo = (val: string | null) => {
        setAssignedTo(val);
    };

    const handleUpdateNotes: ChangeEventHandler<HTMLTextAreaElement> = (e) => {
        setTaskNote(e.target.value);
    }

    const handleSaveTaskDetails = async () => {
        if (!task) return;

        if (taskTitle.trim().length === 0) {
            setTaskError("Title cannot be empty.");
            return;
        }

        await updateTodo({
            todoId: task.id,
            title: taskTitle.trim(),
            listId: task.listId,
            householdId,
            notes: taskNote.trim(),
            assignedToId: assignedTo ? Number(assignedTo) : null,
            dueDate: dateValue instanceof Date ? dayjs(dateValue).format("YYYY-MM-DD") : dateValue,
        });

        close();
    }

    // Props for task details inputs
    const taskDetailsProps = {
        title: { value: taskTitle, onChange: handleUpdateTitle },
        dueDate: { value: dateValue, onChange: handleUpdateDueDate },
        assigned: { value: assignedTo, onChange: handleUpdateAssignedTo },
        notes: { value: taskNote, onChange: handleUpdateNotes },
    }

    const handleConfirmTaskDeletion = () => {
        setShowTaskDeletion(true);
    }

    const getFooterText = () => {
        if (!task) return "";

        // Helper to handle "Today", "Yesterday", or "On [Date]"
        const formatStatusDate = (dateInput: string | Date, action: "Created" | "Completed") => {
            const dateObj = dayjs(dateInput);

            if (dateObj.isToday()) {
                return `${action} today`;
            }
            if (dateObj.isYesterday()) {
                return `${action} yesterday`;
            }

            // Default: "Created on Sun, Jan 8, 2024"
            return `${action} on ${dateObj.format("ddd, MMM D, YYYY")}`;
        };

        // 1. COMPLETED STATE
        if (task.status === "completed" && task.completedAt) {
            return formatStatusDate(task.completedAt, "Completed");
        }

        // 2. CREATED STATE (Default)
        // Ensure we pass the date object correctly (taskDate or task.createdAt)
        return formatStatusDate(taskDate, "Created");
    };

    return {
        taskDetailsProps,
        taskError,
        data,
        selected,
        handleSaveTaskDetails,
        taskDate,
        options,
        showTaskDeletion,
        setShowTaskDeletion,
        handleConfirmTaskDeletion,
        getFooterText
    }

}