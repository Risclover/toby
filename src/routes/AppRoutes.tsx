import { Routes, Route } from "react-router-dom";
import { Join } from "../Join";
import { SignUp } from "../SignUp";
import { UserPage } from "../pages/UserPage";
import { HouseholdTodoLists } from "../component/HouseholdTodoLists";
import { Dashboard } from "@/pages/Dashboard";
import { SignIn } from "@/SignIn";
import { useGetHouseholdTodoListsQuery } from "@/store/householdSlice";
import { useAuthenticateQuery } from "@/store/authSlice";
import { HouseholdTasklists } from "@/features/HouseholdTasklists/components/HouseholdTasklists";
import { HouseholdTasklistPage } from "@/features/HouseholdTasklistPage/components/HouseholdTasklistPage";

export const AppRoutes = () => {
    const { data: user } = useAuthenticateQuery()
    const { data: lists } = useGetHouseholdTodoListsQuery(user?.householdId)
    return (
        <Routes>
            <Route path="/join/:inviteCode" element={<Join />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/users/:userId" element={<UserPage />} />
            <Route path="/tasklists" element={<HouseholdTasklists />} />
            <Route path="/tasklists/:tasklistId" element={<HouseholdTasklistPage />} />
            <Route path="/login" element={<SignIn />} />
            <Route path="/" element={<Dashboard />} />
        </Routes>
    )
}