import { Routes, Route } from "react-router-dom";
import { Join } from "../Join";
import { SignUp } from "../SignUp";
import { UserPage } from "../pages/UserPage";
import { TodoLists } from "../component/TodoLists";
import { Dashboard } from "@/pages/Dashboard";
import { SignIn } from "@/SignIn";

export const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/join/:inviteCode" element={<Join />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/users/:userId" element={<UserPage />} />
            <Route path="/todo_lists" element={<TodoLists />} />
            <Route path="/login" element={<SignIn />} />
            <Route path="/" element={<Dashboard />} />
        </Routes>
    )
}