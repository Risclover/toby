import { DashboardMiniCalendar, UpcomingThisWeek } from "@/features"
import { HomepageCollapseCard } from "./HomepageCollapseCard"
import { useAuthenticateQuery } from "@/store"

export const HomepageEventsCollapseCard = () => {
    const { data: user } = useAuthenticateQuery();
    return (
        <div className="homepage-events">
            <div className="homepage-mini-calendar-container">
                <DashboardMiniCalendar householdId={user?.householdId!} />
            </div>
            <HomepageCollapseCard title="Events" color="rgb(5, 5, 73)" cardKey="events">
                <UpcomingThisWeek householdId={user?.householdId!} />
            </HomepageCollapseCard>
        </div>
    )
}
