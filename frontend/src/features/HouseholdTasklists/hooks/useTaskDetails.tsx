import { useEffect, useMemo, useRef, useState, type ChangeEventHandler } from "react";
import { isNotEmpty, useForm } from "@mantine/form";
import dayjs from "dayjs";

import { useGetHouseholdQuery } from "@/store/householdSlice";
import { useGetTasklistQuery, useUpdateTaskMutation } from "@/store/taskSlice";

type Member = {
    id: number;
    firstName: string;
    lastName: string;
    profileImg: string | null;
}

type Props = {
    taskId: number;
    listId: number;
    householdId: number;
    close: () => void;
}

export type TaskDetailsFormValues = {
    title: string | undefined;
    dueDate: string | Date | null | undefined;
    assignedToId: number | null;
    notes: string | undefined;
}

export const useTaskDetails = ({ taskId, listId, householdId }: Props) => {
    // Mutations
    const [updateTask] = useUpdateTaskMutation();

    // Queries 
    const { data: household } = useGetHouseholdQuery(householdId);
    const { data: tasklist } = useGetTasklistQuery(listId);
    const { task } = useGetTasklistQuery(listId, {
        selectFromResult: ({ data }) => ({
            task: data?.tasks?.find(t => t.id === taskId),
        }),
    })

    // Local state
    const [taskError, setTaskError] = useState<string>("");
    const [showTaskDeletion, setShowTaskDeletion] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const initialValues: TaskDetailsFormValues = {
        title: task?.title.trim(),
        notes: task?.notes?.trim(),
        assignedToId: String(task?.assignedToId) ? Number(task?.assignedToId) : null,
        dueDate: task?.dueDate instanceof Date ? dayjs(task?.dueDate).format("YYYY-MM-DD") : task?.dueDate,
    }

    const form = useForm<TaskDetailsFormValues>({
        initialValues,
        validate: {
            title: isNotEmpty("You must give this task a title."),
        }
    })

    const initializedRef = useRef<number | null>(null);

    useEffect(() => {
        if (!task) return;

        if (initializedRef.current !== task.id) {
            form.setValues(initialValues);
            form.resetDirty();
            initializedRef.current = task.id;
        }
    }, [task?.id])

    // Derived data
    const membersList = useMemo(() =>
        household?.members
            ?.filter((m: Member) => tasklist?.memberIds?.includes(m.id))
            .map((m: Member) => ({
                id: m.id,
                value: String(m.id),
                label: `${m.firstName} ${m.lastName}`,
                firstName: `${m.firstName}`,
                profileImg: `${m.profileImg}`
            }))
        ?? [], [household]);

    const data = membersList.map((m: Member) => ({
        value: String(m.id),
        label: m.firstName,
        profileImg: m.profileImg, // keep raw data for renderOption
    }));

    const selected = data.find((d: { value: string | null; }) => d.value === String(form.values.assignedToId)) || null;

    let taskDate = new Date(task?.createdAt ?? new Date());
    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' } as const;

    // Handlers
    const handleUpdateTitle = async (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (!task) return;
        form.setFieldValue("title", event.target.value);
    };

    const handleUpdateDueDate = (val: string | Date | null | undefined) => {
        const dueDate: string | null = val == null ? null : typeof val === "string" ? val.slice(0, 10) : dayjs(val).format("YYYY-MM-DD");

        form.setFieldValue("dueDate", dueDate);
    };

    const handleUpdateAssignedTo = (val: string | null) => {
        form.setFieldValue("assignedToId", Number(val));
    };

    const handleUpdateNotes: ChangeEventHandler<HTMLTextAreaElement> = (e) => {
        form.setFieldValue("notes", e.target.value);
    }

    const handleSaveTaskDetails = async () => {
        if (!task) return;
        if (!form.isValid()) {
            form.validate();
            return;
        }

        setIsSubmitting(true);

        if (form.values.title?.trim().length === 0) {
            setTaskError("Title cannot be empty.");
            return;
        }

        const payload = {
            taskId: task.id,
            title: form.values.title?.trim(),
            listId: task.listId,
            householdId: householdId,
            notes: form.values.notes?.trim(),
            assignedToId: task?.assignedToId ?? null,
            dueDate: form.values.dueDate instanceof Date ? dayjs(form.values.dueDate).format("YYYY-MM-DD") : form.values.dueDate,
        }

        try {
            await Promise.all([
                updateTask(payload).unwrap(),
                new Promise(resolve => setTimeout(resolve, 400)) // 800ms minimum
            ]);
            setIsSubmitting(false);
        } catch (error) {
            console.error("Failed to update task:", error);
            setIsSubmitting(false);
        }
    }

    // Props for task details inputs
    const taskDetailsProps = {
        title: { value: form.values.title, onChange: handleUpdateTitle },
        dueDate: { value: form.values.dueDate, onChange: handleUpdateDueDate },
        assigned: { value: form.values.assignedToId, onChange: handleUpdateAssignedTo },
        notes: { value: form.values.notes, onChange: handleUpdateNotes },
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

    if (!task) return null;

    return {
        form,
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
        getFooterText,
        isSubmitting,
    }

}