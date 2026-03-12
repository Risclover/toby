import { useState, type MouseEvent } from "react";
import { useAuthenticateQuery, useGenerateInviteMutation, useLoginMutation, useLogoutMutation } from "./store/authSlice";

import { useCreateHouseholdTasklistMutation, useAddTaskMutation } from "./store/taskSlice";

export const SignIn = () => {
    const { data: user } = useAuthenticateQuery(undefined);
    const [logout] = useLogoutMutation();
    const [login] = useLoginMutation();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [inviteCode, setInviteCode] = useState("");
    const [generateInvite] = useGenerateInviteMutation();
    const [createTasklist] = useCreateHouseholdTasklistMutation();
    const [addTask] = useAddTaskMutation();
    const [tasklistId, setTasklistId] = useState<number | undefined>();

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

    const handleCreateNewTasklist = async (e: MouseEvent) => {
        e.preventDefault();
        const { data } = await createTasklist({ title: "Hello", userId: user.id, householdId: user.householdId });
        setTasklistId(data?.id);
    }

    const handleAddTask = async (e: MouseEvent) => {
        e.preventDefault();
        await addTask({ title: "One", householdId: user.householdId, description: "One task", status: "in_progress", isImportant: false, dueDate: undefined, assignedToId: user?.id, listId: tasklistId })
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
            <button onClick={handleCreateNewTasklist}>Create new tasklist</button>
            <button onClick={handleAddTask}>Add Task to Tasklist</button>


        </div>
    )
}