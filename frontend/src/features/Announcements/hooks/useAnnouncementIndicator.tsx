import { useGetAnnouncementsQuery } from "@/store"

export const useAnnouncementIndicator = (householdId: number) => {
    const { data } = useGetAnnouncementsQuery({ householdId, limit: 50 });
    const hasUnseen = (data?.items ?? []).some((item) => item.seenByCurrent === false);
    return hasUnseen;
}