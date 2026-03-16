import { useGetAnnouncementsQuery } from "@/store"

export const useAnnouncementIndicator = (householdId: number | undefined) => {
    const { data } = useGetAnnouncementsQuery(
        { householdId: householdId!, limit: 50 },
        { skip: !householdId, pollingInterval: 30000 }
    );
    const hasUnseen = (data?.items ?? []).some((item) => item.seenByCurrent === false);
    return hasUnseen;
}