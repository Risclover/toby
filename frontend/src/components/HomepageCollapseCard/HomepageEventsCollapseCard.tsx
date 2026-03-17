import { DashboardMiniCalendar, UpcomingThisWeek } from "@/features"
import { HomepageCollapseCard } from "./HomepageCollapseCard"
import { useAuthenticateQuery } from "@/store"
import { useState } from "react";

export const HomepageEventsCollapseCard = ({ isReady }: { isReady: boolean }) => {
    const { data: user } = useAuthenticateQuery();

    const [showAddEvent, setShowAddEvent] = useState(false);

    return (
        <div className="homepage-events">
            <div className="homepage-mini-calendar-container">
                <DashboardMiniCalendar householdId={user?.householdId!} showAddEvent={showAddEvent} setShowAddEvent={setShowAddEvent} />
            </div>
            <HomepageCollapseCard title="Upcoming Events" color="rgb(5, 5, 73)" cardKey="events">
                <UpcomingThisWeek isReady={isReady} householdId={user?.householdId!} />
            </HomepageCollapseCard>
        </div>
    )
}
