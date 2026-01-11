import { useCompleteTodoMutation, useGetTodoListQuery } from "@/store/todoSlice";
import { Checkbox } from "@mantine/core";
import { useEffect, useState, type ChangeEvent } from "react";
import DeleteRounded from '@mui/icons-material/Delete';
import BorderColorRoundedIcon from '@mui/icons-material/BorderColorRounded';
import { TaskDeletionConfirmation } from "./TaskDeletionConfirmation";
import { TaskDetails } from "./TaskDetails";
import { TaskExtra } from "./TaskExtra";
import StarRoundedIcon from '@mui/icons-material/StarRounded';

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

    // keep local state in sync if task.status changes externally
    useEffect(() => {
        setChecked(task?.status === "completed");
    }, [task?.status]);

    const onChange = async (e: ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        const nextChecked = e.currentTarget.checked;

        setChecked(nextChecked);

        try {
            await completeTodo({
                todoId: task?.id,
                listId,
                completed: nextChecked,
                householdId: householdId
            }).unwrap();
        } catch (err) {
            setChecked((prev) => !prev);
            console.error("Failed to toggle todo:", err);
        }
    };

    if (!task) return null;

    return (
        <div className="task">
            <div className="household-tasklist-page-task" onClick={() => setShowTaskDetails(true)}>
                <div className="task-left">
                    <div className="task-main">
                        <Checkbox
                            radius="xl"
                            color="cyan"
                            checked={checked}
                            onChange={onChange}
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                        />
                        {checked ? (
                            <div className="completed-task">{task?.title}</div>
                        ) : (
                            <div className="task-title">{task?.title}</div>
                        )}
                    </div>
                    <div className="task-left-bottom">
                        <div className="invisible-wall"></div>
                        {!checked && <TaskExtra todo={task} listId={listId} householdId={householdId} />}
                    </div>
                </div>
                {showDeleteConfirmation &&
                    <TaskDeletionConfirmation
                        title={task.title}
                        onClose={() => setShowDeleteConfirmation(false)}
                        opened={showDeleteConfirmation}
                        listId={task.listId}
                        todoId={task.id}
                    />}
            </div>
            {showTaskDetails && <TaskDetails opened={showTaskDetails} close={() => setShowTaskDetails(false)} taskId={task.id} listId={listId} householdId={householdId} />}
        </div>
    );
}
