import { useStablePending } from "@/hooks/useStablePending";
import { useAddTodoMutation } from "@/store/todoSlice";
import { Button } from "@mantine/core"
import { useRef, useState } from "react"

type Props = {
    listId: number | undefined;
}

export const HouseholdTasklistPageAddTask = ({ listId }: Props) => {
    const inputRef = useRef<HTMLInputElement>(null)
    const [title, setTitle] = useState("");
    const [addTodo, { isLoading }] = useAddTodoMutation();
    const loading = useStablePending(isLoading, { showAfterMs: 120, minVisibleMs: 300 });


    const handleTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTitle(e.target.value)
    }

    const handleAddTodo = async () => {
        if (title.trim() === "") return;
        await addTodo({ title: title, description: "", status: "in_progress", priority: "low", dueDate: undefined, listId: listId })
        setTitle("");
        inputRef.current?.focus();
    }

    return <div className="add-task-container"><div className="add-task shell-footer">
        <input value={title} onKeyDown={(e) => { if (e.key === "Enter") { handleAddTodo() } }} ref={inputRef} onChange={handleTitle} type="text" placeholder="Add a task and press Enter" />
        <Button color="cyan" loading={loading} onClick={handleAddTodo}>Add</Button>
    </div>
    </div>
}