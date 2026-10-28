import { CalendarMemberFilter, DashboardMiniCalendar, HomepageCalendarScope, UpcomingEvents } from "@/features";
import { useAuthenticateQuery } from "@/store";
import { HomepageCollapseCard } from "./HomepageCollapseCard";
import { UpcomingFooter } from "../../features/Events/components/UpcomingEvents/UpcomingFooter";

export const HomepageEventsCollapseCard = ({ isReady }: { isReady: boolean }) => {
    const { data: user } = useAuthenticateQuery();

    return (
        <HomepageCalendarScope>
            <div className="homepage-events">
                <div className="homepage-mini-calendar-container">
                    <DashboardMiniCalendar />
                </div>
                <HomepageCollapseCard title="Upcoming Events" color="navy" cardKey="events" scrollSelector=".upcoming-events">
                    <UpcomingEvents isReady={isReady} householdId={user?.householdId!} />
                    <UpcomingFooter />
                </HomepageCollapseCard>
            </div>
        </HomepageCalendarScope>
    );
};