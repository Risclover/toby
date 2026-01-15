import { useState, type MouseEvent } from "react"
import { AddNewTask } from "./AddNewTask";
import { useCompleteTaskMutation, useDeleteListMutation, type Task } from "../store/taskSlice";
import { Button } from "@mantine/core";
import { useAuthenticateQuery } from "@/store/authSlice";

type Props = {
    list: any
}
export const Tasklist = ({ list }: Props) => {
    const { data: user } = useAuthenticateQuery();

    const [showForm, setShowForm] = useState(false);
    const [completeTask] = useCompleteTaskMutation()
    const [deleteList] = useDeleteListMutation();


    const handleCompleteTask = async (e: MouseEvent, taskId: number) => {
        e.preventDefault()
        await completeTask({ taskId: taskId, listId: list.id, completed: false })
    }

    const handleDeleteList = async () => {
        await deleteList({ listId: list.id })
    }

    console.log(list)

    if (!list?.memberIds?.includes(user.id)) return null;


    return <div key={list.id} style={{ marginBottom: "1rem", padding: "0.5rem", border: "1px solid #ccc" }}>
        <h3>{list.title}</h3>
        <div style={{ marginLeft: "1rem" }}>
            {list.tasks?.map((task: Task) => (
                <div key={task.id}>
                    <button onClick={(e) => handleCompleteTask(e, task.id)}>x</button>{task.title} - {task.description} {task.isImportant}
                </div>
            ))}
        </div>
        <Button variant="filled" color="cyan" onClick={handleDeleteList}>Delete List</Button>
        <button onClick={() => setShowForm(true)}>Add Task</button>

        {showForm && <AddNewTask tasklistId={list.id} />}

    </div>
}