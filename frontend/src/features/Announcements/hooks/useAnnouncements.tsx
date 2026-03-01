import { useAuthenticateQuery, useGetAnnouncementsQuery, useGetHouseholdQuery } from "@/store"

export const useAnnouncements = () => {
    const { data: user } = useAuthenticateQuery();
    const { data: household } = useGetHouseholdQuery(user?.householdId);
    return useGetAnnouncementsQuery({ householdId: household?.id, limit: 50 });
};