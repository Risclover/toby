import { useCompleteTaskMutation, useGetTasklistQuery } from "@/store/taskSlice";
import { Checkbox } from "@mantine/core";
import { useEffect, useState, type ChangeEvent } from "react";
import { TaskDeletionConfirmation } from "./TaskDeletionConfirmation";
import { TaskExtra } from "./TaskExtra";

type Props = {
    taskId: number;
    listId: number;
    householdId: number;
};

export function HouseholdTasklistPageTask({ taskId, listId, householdId }: Props) {
    const { task } = useGetTasklistQuery(listId, {
        selectFromResult: ({ data }) => ({
            task: data?.tasks?.find(t => t.id === taskId),
        }),
    });

    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [checked, setChecked] = useState(task?.status === "completed");
    const [completeTask] = useCompleteTaskMutation();

    // keep local state in sync if task.status changes externally
    useEffect(() => {
        setChecked(task?.status === "completed");
    }, [task?.status]);

    const onChange = async (e: ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        const nextChecked = e.currentTarget.checked;

        setChecked(nextChecked);

        try {
            await completeTask({
                taskId: task?.id,
                listId,
                completed: nextChecked,
                householdId: householdId
            }).unwrap();
        } catch (err) {
            setChecked((prev) => !prev);
            console.error("Failed to toggle task:", err);
        }
    };

    if (!task) return null;

    return (
        <div>
            <div className="household-tasklist-page-task">
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
                        {!checked && <TaskExtra task={task} listId={listId} householdId={householdId} />}
                    </div>
                </div>
                {showDeleteConfirmation &&
                    <TaskDeletionConfirmation
                        title={task.title}
                        onClose={() => setShowDeleteConfirmation(false)}
                        opened={showDeleteConfirmation}
                        listId={task.listId}
                        taskId={task.id}
                    />}
            </div>
        </div>
    );
}
