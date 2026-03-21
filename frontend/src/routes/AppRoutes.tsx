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
import { OnboardingPage } from "@/features/Auth/components/OnboardingPage";
import { OnboardingRoute } from "./OnboardingRoute";
import { ProtectedRoute } from "./ProtectedRoute";
import { GuestRoute } from "./GuestRoute";

export const AppRoutes = () => {
    const isMobile = useIsMobile();
    const isSmallScreen = useIsSmallScreen();

    return (
        <Routes>
            <Route path="/join/:inviteCode" element={<GuestRoute><Registration createHousehold={false} /></GuestRoute>} />
            <Route path="/signup" element={<GuestRoute><Registration createHousehold={true} /></GuestRoute>} />
            <Route path="/users/:userId" element={<UserPage />} />
            <Route path="/tasklists/archived" element={<ProtectedRoute><ArchivedHouseholdTasklistsPage /></ProtectedRoute>} />
            <Route path="/tasklists" element={<ProtectedRoute><MobileTasklists /></ProtectedRoute>} />
            <Route path="/tasklists/:tasklistId" element={<ProtectedRoute><MobileTasklist /></ProtectedRoute>} />
            <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
            <Route path="/shopping" element={<ProtectedRoute><ShoppingListsPage /></ProtectedRoute>} />
            <Route path="/shopping/:listId" element={<ProtectedRoute><ShoppingListPage /></ProtectedRoute>} />
            <Route path="/" element={(isMobile || isSmallScreen) ? <ProtectedRoute><MobileHome /></ProtectedRoute> : <ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/announcements" element={<ProtectedRoute><MobileAnnouncements /></ProtectedRoute>} />
            <Route path="/reminders" element={<ProtectedRoute><AllRemindersPage /></ProtectedRoute>} />
            <Route path="/onboarding" element={<OnboardingRoute />} />

        </Routes>
    )
}