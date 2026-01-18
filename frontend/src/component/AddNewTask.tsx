import { useState, type MouseEvent } from "react"
import { useAddTaskMutation } from "@/store/taskSlice";

type Props = {
    tasklistId: number
}
export const AddNewTask = ({ tasklistId }: Props) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [addTask] = useAddTaskMutation();

    const handleAddTask = async (e: MouseEvent) => {
        e.preventDefault();
        await addTask({
            title: title, description: description, status: "in_progress", isImportant: false, dueDate: undefined, assignedToId: undefined, listId: tasklistId
        })

    }

    return (
        <div>
            <input type="text" name="title" id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
            <input type="text" name="description" id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
            <button onClick={handleAddTask}>Add Task</button>
        </div>
    )
}