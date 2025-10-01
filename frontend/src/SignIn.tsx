import { useState, type MouseEvent } from "react";
import { useAuthenticateQuery, useGenerateInviteMutation, useLoginMutation, useLogoutMutation } from "./store/authSlice";
import { useAddTodoMutation, useCreateHouseholdTodoListMutation } from "./store/todoSlice";
export const SignIn = () => {
    const { data: user } = useAuthenticateQuery(undefined);
    const [logout] = useLogoutMutation();
    const [login] = useLoginMutation();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [inviteCode, setInviteCode] = useState("");
    const [generateInvite] = useGenerateInviteMutation();
    const [createTodoList] = useCreateHouseholdTodoListMutation();
    const [addTodo] = useAddTodoMutation();
    const [todoListId, setTodoListId] = useState<number | undefined>();

    const handleLogout = async () => {
        await logout();
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
        setTodoListId(data?.id);
    }

    const handleAddTodo = async (e: MouseEvent) => {
        e.preventDefault();
        await addTodo({ title: "One", description: "One todo", status: "in_progress", priority: "low", dueDate: undefined, assignedToId: user?.id, listId: todoListId })
    }

    return (
        <div className="login-page">
            {!user?.email && <form onSubmit={handleLogin}>
                <input type="email" id="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
                <input type="password" id="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
                <button type="submit">Log In</button>
            </form>}
            <br />{user?.email && "Welcome, " + user?.name}<br />
            {user?.email && <button onClick={handleLogout}>Logout</button>}
            <br /><button onClick={handleInvite}>Click to invite!</button>
            {inviteCode ? <div onClick={handleCopy}>localhost:5173/join/{inviteCode}</div> : ""}
            <button onClick={handleCreateNewTodoList}>Create new todo list</button>
            <button onClick={handleAddTodo}>Add Todo to Todo List</button>


        </div>
    )
}