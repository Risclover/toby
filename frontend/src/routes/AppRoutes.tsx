import { Routes, Route } from "react-router-dom";
import { Join } from "../Join";
import { SignUp } from "../SignUp";
import { UserPage } from "../pages/UserPage";
import { Dashboard } from "@/pages/Dashboard";
import { SignIn } from "@/SignIn";
import { HouseholdTasklists } from "@/features/HouseholdTasklists/components/HouseholdTasklists";
import { HouseholdTasklistPage } from "@/features/HouseholdTasklistPage/components/HouseholdTasklistPage";
import { Registration } from "@/features/Auth/components/Registration";
import { Login } from "@/features/Auth/components/Login";
import { ShoppingLists } from "@/features/Shopping/components/ShoppingLists";
import { ShoppingListsPage } from "@/pages/ShoppingListsPage";
import { ShoppingList } from "@/features/Shopping/components/ShoppingList";
import { ShoppingListPage } from "@/pages/ShoppingListPage";

export const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/join/:inviteCode" element={<Registration createHousehold={false} />} />
            <Route path="/signup" element={<Registration createHousehold={true} />} />
            <Route path="/users/:userId" element={<UserPage />} />
            <Route path="/tasklists" element={<HouseholdTasklists />} />
            <Route path="/tasklists/:tasklistId" element={<HouseholdTasklistPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/shopping" element={<ShoppingListsPage />} />
            <Route path="/shopping/:listId" element={<ShoppingListPage />} />
            <Route path="/" element={<Dashboard />} />
        </Routes>
    )
}