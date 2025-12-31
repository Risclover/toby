// frontend/src/hooks/useUnseenAnnouncements.ts
import { useGetAnnouncementsQuery } from "@/store/announcementSlice";

export const useUnseenAnnouncements = (householdId: number | undefined) => {
    // This query ALWAYS runs for notification purposes
    const { data } = useGetAnnouncementsQuery(
        { householdId: householdId!, limit: 10, page: 1 }, // Just fetch first page for efficiency
        {
            skip: !householdId,
            pollingInterval: 30000 // Check for new announcements every 30 seconds
        }
    );

    const unseenCount = data?.items?.filter(a => !a.seenByCurrent).length ?? 0;
    const hasUnseen = unseenCount > 0;

    return { unseenCount, hasUnseen };
};
