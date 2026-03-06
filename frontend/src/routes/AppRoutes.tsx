import { Routes, Route } from "react-router-dom";
import { UserPage } from "../pages/UserPage";
import { Dashboard } from "@/pages/Dashboard";
import { Registration } from "@/features/Auth/components/Registration";
import { Login } from "@/features/Auth/components/Login";
import { ShoppingListsPage } from "@/pages/ShoppingListsPage";
import { ShoppingListPage } from "@/pages/ShoppingListPage";
import { MobileHome } from "@/pages/MobileHome";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useIsSmallScreen } from "@/hooks/useIsSmallScreen";
import { MobileAnnouncements } from "@/pages/MobileAnnouncements";
import { MobileTasklist } from "@/features/HouseholdTasklists/components/MobileTasklists/MobileTasklist";
import { MobileTasklists } from "@/features/HouseholdTasklists/components/MobileTasklists/MobileTasklists";
import { ArchivedHouseholdTasklistsPage } from "@/pages/ArchivedHouseholdTasklistsPage";
import { AllRemindersPage } from "@/features/Reminders/components/AllReminders/AllRemindersPage";

export const AppRoutes = () => {
    const isMobile = useIsMobile();
    const isSmallScreen = useIsSmallScreen();

    return (
        <Routes>
            <Route path="/join/:inviteCode" element={<Registration createHousehold={false} />} />
            <Route path="/signup" element={<Registration createHousehold={true} />} />
            <Route path="/users/:userId" element={<UserPage />} />
            <Route path="/tasklists/archived" element={<ArchivedHouseholdTasklistsPage />} />
            <Route path="/tasklists" element={<MobileTasklists />} />
            <Route path="/tasklists/:tasklistId" element={<MobileTasklist />} />
            <Route path="/login" element={<Login />} />
            <Route path="/shopping" element={<ShoppingListsPage />} />
            <Route path="/shopping/:listId" element={<ShoppingListPage />} />
            <Route path="/" element={(isMobile || isSmallScreen) ? <MobileHome /> : <Dashboard />} />
            <Route path="/announcements" element={<MobileAnnouncements />} />
            <Route path="/reminders" element={<AllRemindersPage />} />
        </Routes>
    )
}