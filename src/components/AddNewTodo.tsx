import { useState, type MouseEvent } from "react"
import { useAddTodoMutation } from "../store/todoSlice";

type Props = {
    todoListId: number
}
export const AddNewTodo = ({ todoListId }: Props) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [addTodo] = useAddTodoMutation();

    const handleAddTodo = async (e: MouseEvent) => {
        e.preventDefault();
        await addTodo({
            title: title, description: description, status: "in_progress", priority: "low", dueDate: undefined, assignedToId: undefined, listId: todoListId
        })

    }

    return <div>
        <input type="text" name="title" id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
        <input type="text" name="description" id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
        <button onClick={handleAddTodo}>Add Todo</button>
    </div>
}