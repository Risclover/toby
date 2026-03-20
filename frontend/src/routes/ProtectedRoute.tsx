import { OnboardingPage } from "@/features/Auth/components/OnboardingPage";
import { useAuthenticateQuery } from "@/store"
import { Navigate } from "react-router-dom";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { data: user, isLoading, isFetching } = useAuthenticateQuery();
    if (isLoading || isFetching) return null;
    if (!user?.id) return <Navigate to="/login" />;
    if (!user.householdId) return <Navigate to="/onboarding" />;
    return <>{children}</>;
}