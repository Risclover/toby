import { skipToken } from "@reduxjs/toolkit/query/react";
import { useAuthenticateQuery, useGetHouseholdQuery } from "@/store";

export const useHousehold = () => {
    const { data: user } = useAuthenticateQuery();
    return useGetHouseholdQuery(user?.householdId ?? skipToken);
};