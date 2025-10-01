import { useState, type MouseEvent } from "react"
import { AddNewTodo } from "./AddNewTodo";
import { useCompleteTodoMutation, useDeleteListMutation, type Todo } from "../store/todoSlice";
import { Button } from "@mantine/core";
import { useAuthenticateQuery } from "@/store/authSlice";

type Props = {
    list: any
}
export const TodoList = ({ list }: Props) => {
    const { data: user } = useAuthenticateQuery();

    const [showForm, setShowForm] = useState(false);
    const [completeTodo] = useCompleteTodoMutation()
    const [deleteList] = useDeleteListMutation();


    const handleCompleteTodo = async (e: MouseEvent, todoId: number) => {
        e.preventDefault()
        await completeTodo({ todoId: todoId, listId: list.id, completed: false })
    }

    const handleDeleteList = async () => {
        await deleteList({ listId: list.id })
    }

    console.log(list)

    if (!list?.memberIds?.includes(user.id)) return null;


    return <div key={list.id} style={{ marginBottom: "1rem", padding: "0.5rem", border: "1px solid #ccc" }}>
        <h3>{list.title}</h3>
        <div style={{ marginLeft: "1rem" }}>
            {list.todos?.map((todo: Todo) => (
                <div key={todo.id}>
                    <button onClick={(e) => handleCompleteTodo(e, todo.id)}>x</button>{todo.title} - {todo.description} {todo.priority}
                </div>
            ))}
        </div>
        <Button variant="filled" color="cyan" onClick={handleDeleteList}>Delete List</Button>
        <button onClick={() => setShowForm(true)}>Add Todo</button>

        {showForm && <AddNewTodo todoListId={list.id} />}

    </div>
}