import { EditableTitle } from "@/component/EditableTitle";
import { useCompleteTodoMutation, useUpdateTodoMutation, type Todo } from "@/store/todoSlice";
import { Checkbox } from "@mantine/core";
import { useEffect, useState, type ChangeEvent } from "react";

type Props = {
    task: Todo;
    listId: number;
    householdId: number;
};

export function HouseholdTasklistPageTask({ task, listId, householdId }: Props) {
    const [checked, setChecked] = useState(task.status === "completed");
    const [completeTodo, { isLoading }] = useCompleteTodoMutation();
    const [updateTodoTitle] = useUpdateTodoMutation();

    // keep local state in sync if task.status changes externally
    useEffect(() => {
        setChecked(task.status === "completed");
    }, [task.status]);

    const onChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const nextChecked = e.currentTarget.checked;

        // optimistic UI
        setChecked(nextChecked);

        try {
            await completeTodo({
                todoId: task.id,
                listId,
                completed: nextChecked,
                householdId: householdId
            }).unwrap();
        } catch (err) {
            // rollback if request fails
            setChecked((prev) => !prev);
            console.error("Failed to toggle todo:", err);
        }
    };

    const handleUpdateTitle = async (next: string) => {
        if (!task) return; // guard
        await updateTodoTitle({ todoId: task.id, title: next, listId }).unwrap();
    };

    return (
        <div className="household-tasklist-page-task">
            <Checkbox
                radius="xl"
                color="violet"
                checked={checked}
                onChange={onChange}
                disabled={isLoading}
            />
            {checked ? (
                <div className="completed-task">{task.title}</div>
            ) : (
                <EditableTitle title={task.title} onSave={handleUpdateTitle} className="household-tasklist-page-title editable-title" />
            )}
        </div>
    );
}
