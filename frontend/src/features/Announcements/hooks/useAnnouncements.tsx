import { useAuthenticateQuery, useGetAnnouncementsQuery, useGetHouseholdQuery } from "@/store"

export const useAnnouncements = () => {
    const { data: user } = useAuthenticateQuery();
    return useGetAnnouncementsQuery(
        { householdId: user?.householdId!, limit: 50 },
        { skip: !user?.householdId }
    );
};