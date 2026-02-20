import { useAuthenticateQuery, useGetAnnouncementsQuery, useGetHouseholdQuery } from "@/store";

export const NoticeBoardAnnouncements = () => {
    const { data: user } = useAuthenticateQuery();
    const { data: household } = useGetHouseholdQuery(user?.householdId);
    let householdId = household?.id;

    const { data } = useGetAnnouncementsQuery({ householdId: householdId });

    console.log('data:', data);

    return (
        <div className="notice-board-announcements-container">

        </div>
    )
}