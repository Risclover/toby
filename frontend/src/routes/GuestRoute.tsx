import { useAuthenticateQuery } from "@/store";
import { Navigate } from "react-router-dom";

export const GuestRoute = ({ children }: { children: React.ReactNode }) => {
    const { data: user, isLoading, isFetching } = useAuthenticateQuery();
    if (isLoading) return null;
    if (user?.id) return <Navigate to="/" />;
    return <>{children}</>;
};