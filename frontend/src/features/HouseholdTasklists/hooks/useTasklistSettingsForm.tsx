import { useEffect, useMemo, useState } from "react";

export type TasklistDefaultFilters = {
    importance: "all" | "important";
    assignedToId: number | null;
    time: "past_due" | "today" | "tomorrow" | "this_week" | "this_month" | "all";
};

export type TasklistSettingsForm = {
    title: string;
    autoHide: boolean;
    newTaskPosition: "top" | "bottom";
    starsAtTop: boolean;
    sortOrder: string | null;
    viewMode: string;
    color?: string;
    defaultFilters: TasklistDefaultFilters;
    allMembers: boolean;
    memberIds: number[];
};

export function createInitialForm(tasklist: any): TasklistSettingsForm {
    return {
        title: tasklist?.title ?? "",
        autoHide: tasklist?.autoHideWhenEmpty ?? false,
        newTaskPosition: tasklist?.newItemPosition ?? "bottom",
        starsAtTop: tasklist?.starsAtTop ?? false,
        sortOrder: tasklist?.defaultSortOrder ?? null,
        viewMode: tasklist?.viewMode ?? "detailed",
        color: tasklist?.color,
        defaultFilters: {
            importance: tasklist?.defaultFilters?.importance ?? "all",
            assignedToId: tasklist?.defaultFilters?.assignedToId ?? null,
            time: tasklist?.defaultFilters?.time ?? "all",
        },
        allMembers: tasklist?.allMembers ?? false,
        memberIds: tasklist?.memberIds ?? [],
    };
}

export function useTasklistSettingsForm(tasklist?: any) {
    const [form, setForm] = useState<TasklistSettingsForm | null>(null);

    useEffect(() => {
        if (tasklist) {
            setForm(createInitialForm(tasklist));
        }
    }, [tasklist]);

    const update = <K extends keyof TasklistSettingsForm>(
        key: K,
        value: TasklistSettingsForm[K]
    ) => {
        setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    };

    const original = useMemo(
        () => (tasklist ? createInitialForm(tasklist) : null),
        [tasklist]
    );

    const hasChanges =
        original && form
            ? JSON.stringify(original) !== JSON.stringify(form)
            : false;

    return {
        form,
        setForm,
        update,
        hasChanges,
    };
}
