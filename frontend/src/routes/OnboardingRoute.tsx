import { Navigate } from "react-router-dom";
import { useAuthenticateQuery } from "@/store";
import { OnboardingPage } from "@/features/Auth/components/OnboardingPage";

export const OnboardingRoute = () => {
    const { data: user, isLoading, isFetching } = useAuthenticateQuery();
    if (isLoading || isFetching) return null;
    if (!user?.id) return <Navigate to="/signup" />;
    if (user.householdId) return <Navigate to="/" />;
    return <OnboardingPage />;
};