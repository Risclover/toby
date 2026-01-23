import { useStablePending } from "@/hooks/useStablePending";
import { useAddTaskMutation } from "@/store/taskSlice";
import { Button } from "@mantine/core"
import { useState, type RefObject } from "react"

type Props = {
    inputRef?: RefObject<HTMLInputElement | null>;
    listId: number | undefined;
}

export const HouseholdTasklistPageAddTask = ({ inputRef, listId }: Props) => {
    const [title, setTitle] = useState("");
    const [addTask, { isLoading }] = useAddTaskMutation();
    const loading = useStablePending(isLoading, { showAfterMs: 120, minVisibleMs: 300 });


    const handleTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTitle(e.target.value)
    }

    const handleAddTask = async () => {
        if (title.trim() === "") return;
        await addTask({ title: title, description: "", status: "in_progress", isImportant: false, dueDate: undefined, listId: listId })
        setTitle("");
        inputRef?.current?.focus();
    }

    return <div className="add-task-container">
        <div className="add-task shell-footer">
            <input

                value={title}
                onKeyDown={(e) => { if (e.key === "Enter") { handleAddTask() } }}
                ref={inputRef}
                onChange={handleTitle}
                type="text"
                placeholder="Add a task and press Enter"
                maxLength={255}
            />
            <Button color="var(--tasklist-color)" loading={loading} onClick={handleAddTask}>Add</Button>
        </div>
    </div>
}