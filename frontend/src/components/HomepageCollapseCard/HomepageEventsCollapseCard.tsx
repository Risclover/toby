import { useNavigate } from "react-router-dom";
import { DashboardMiniCalendar, UpcomingEvents } from "@/features";
import { useAuthenticateQuery } from "@/store";
import { HomepageCollapseCard } from "./HomepageCollapseCard";
import { HomepageCollapseCardFooter } from "./HomepageCollapseCardFooter";

export const HomepageEventsCollapseCard = ({ isReady }: { isReady: boolean }) => {
    const navigate = useNavigate();
    const { data: user } = useAuthenticateQuery();
    const householdId = user?.householdId!;

    return (
        <div className="homepage-events">
            <div className="homepage-mini-calendar-container">
                <DashboardMiniCalendar householdId={householdId} />
            </div>
            <HomepageCollapseCard title="Upcoming Events" color="navy" cardKey="events" scrollSelector=".upcoming-events">
                <UpcomingEvents
                    isReady={isReady}
                    householdId={householdId}
                    renderFooter={({ onAddEvent }) => (
                        <HomepageCollapseCardFooter
                            color="var(--primary)"
                            addBtnText="+ New event"
                            addBtnOnClick={onAddEvent}
                            viewAllBtnOnClick={() => navigate("/calendar")}
                        />
                    )}
                />
            </HomepageCollapseCard>
        </div>
    );
};