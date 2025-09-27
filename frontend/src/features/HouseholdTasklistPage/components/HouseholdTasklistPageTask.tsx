import { EditableTitle } from "@/component/EditableTitle";
import { useCompleteTodoMutation, useGetTodoListQuery, useUpdateTodoMutation, type Todo } from "@/store/todoSlice";
import { Checkbox } from "@mantine/core";
import { useEffect, useState, type ChangeEvent } from "react";
import DeleteRounded from '@mui/icons-material/Delete';
import BorderColorRoundedIcon from '@mui/icons-material/BorderColorRounded';
import { TaskDeletionConfirmation } from "./TaskDeletionConfirmation";
import { TaskDetails } from "./TaskDetails";
import { TaskExtra } from "./TaskExtra";

type Props = {
    taskId: number;
    listId: number;
    householdId: number;
};

export function HouseholdTasklistPageTask({ taskId, listId, householdId }: Props) {
    const { task } = useGetTodoListQuery(listId, {
        selectFromResult: ({ data }) => ({
            task: data?.todos?.find(t => t.id === taskId),
        }),
    });

    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [showTaskDetails, setShowTaskDetails] = useState(false);
    const [checked, setChecked] = useState(task?.status === "completed");
    const [completeTodo, { isLoading }] = useCompleteTodoMutation();
    const [updateTodoTitle] = useUpdateTodoMutation();

    // keep local state in sync if task.status changes externally
    useEffect(() => {
        setChecked(task?.status === "completed");
    }, [task?.status]);

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
        await updateTodoTitle({ todoId: task.id, title: next, listId, householdId }).unwrap();
    };

    console.log('task:', task)
    if (!task) return null;

    return (
        <div className="household-tasklist-page-task">
            <div className="task-check">
                <Checkbox
                    radius="xl"
                    color="violet"
                    checked={checked}
                    onChange={onChange}
                    disabled={isLoading}
                />
            </div>
            <div className="task-main">
                {checked ? (
                    <div className="completed-task">{task?.title}</div>
                ) : (
                    <span>{task?.title}</span>
                )}
                {!checked && <TaskExtra todo={task} listId={listId} householdId={householdId} />}
            </div>
            {!checked && <div className="household-tasklist-page-btns">
                <BorderColorRoundedIcon onClick={() => setShowTaskDetails(true)} />
                <DeleteRounded onClick={() => setShowDeleteConfirmation(true)} />
            </div>}
            {showDeleteConfirmation &&
                <TaskDeletionConfirmation
                    title={task.title}
                    onClose={() => setShowDeleteConfirmation(false)}
                    opened={showDeleteConfirmation}
                    listId={task.listId}
                    todoId={task.id}
                />}
            {showTaskDetails && <TaskDetails opened={showTaskDetails} close={() => setShowTaskDetails(false)} taskId={task.id} listId={listId} householdId={householdId} />}
        </div>
    );
}
