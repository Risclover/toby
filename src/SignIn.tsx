import { useState, type MouseEvent } from "react";
import { useAuthenticateQuery, useGenerateInviteMutation, useLoginMutation, useLogoutMutation } from "./store/authSlice";
import { useAddTodoMutation, useCreateTodoListMutation, useGetTodoListQuery } from "./store/todoSlice";
import { data } from "react-router-dom";
import { Navbar } from "./components/Navbar";

export const SignIn = () => {
    const { data: user } = useAuthenticateQuery(undefined);
    const [logout] = useLogoutMutation();
    const [login] = useLoginMutation();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [title, setTitle] = useState("");

    const [inviteCode, setInviteCode] = useState("");
    const [generateInvite] = useGenerateInviteMutation();
    const [createTodoList] = useCreateTodoListMutation();
    const [addTodo] = useAddTodoMutation();
    const [todoListId, setTodoListId] = useState();
    const { data: todoList } = useGetTodoListQuery(todoListId);


    const handleLogout = async () => {
        await logout();
        console.log('user:', user)
        setEmail("");
        setPassword("");
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        await login({ email, password });
        console.log('user:', user);
    }

    const handleInvite = async () => {
        const { data } = await generateInvite({ householdId: user.householdId });
        if (data) {
            setInviteCode(data.invite_code)
        }
    }

    const handleCopy = async () => {
        await navigator.clipboard.writeText(`localhost:5173/join/${inviteCode}`);
    }

    const handleCreateNewTodoList = async (e: MouseEvent) => {
        e.preventDefault();
        const { data } = await createTodoList({ title: "Hello", userId: user.id, householdId: user.householdId });
        console.log('data:', data)
        setTodoListId(data.id);
    }

    const handleAddTodo = async (e: MouseEvent) => {
        e.preventDefault();
        const { data } = await addTodo({ title: "One", description: "One todo", status: "in_progress", priority: "low", dueDate: undefined, assignedToId: user?.id, listId: todoListId })
        console.log('data:', todoList);

    }
    return (
        <>
            {!user?.email && <form onSubmit={handleLogin}>
                <input type="email" id="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
                <input type="password" id="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
                <button type="submit">Log In</button>
            </form>}
            <br />{user?.email && "Welcome, " + user?.username}<br />
            {user?.email && <button onClick={handleLogout}>Logout</button>}
            <br /><button onClick={handleInvite}>Click to invite!</button>
            {inviteCode ? <div onClick={handleCopy}>localhost:5173/join/{inviteCode}</div> : ""}
            <button onClick={handleCreateNewTodoList}>Create new todo list</button>
            <button onClick={handleAddTodo}>Add Todo to Todo List</button>


        </>
    )
}