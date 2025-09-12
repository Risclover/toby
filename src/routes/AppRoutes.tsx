import { Routes, Route, BrowserRouter } from "react-router-dom";
import { Join } from "../Join";
import { SignUp } from "../SignUp";
import { SignIn } from "../SignIn";
import { UserPage } from "../pages/UserPage";
import { TodoLists } from "../components/TodoLists";
import { Dashboard } from "../pages/Dashboard";

export const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/join/:inviteCode" element={<Join />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/users/:userId" element={<UserPage />} />
            <Route path="/todo_lists" element={<TodoLists />} />
            <Route path="/" element={<Dashboard />} />
        </Routes>
    )
}