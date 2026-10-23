import { useNavigate } from "react-router-dom";
import { DashboardMiniCalendar, UpcomingEvents } from "@/features";
import { HomepageCollapseCard } from "./HomepageCollapseCard";
import { HomepageCollapseCardFooter } from "./HomepageCollapseCardFooter";
import { useAuthenticateQuery } from "@/store";

type Props = {
    isReady: boolean;
}

export const HomepageEventsCollapseCard = ({ isReady }: Props) => {
    const navigate = useNavigate();
    const { data: user } = useAuthenticateQuery();
    const householdId = user?.householdId!;

    return (
        <div className="homepage-events">
            <div className="homepage-mini-calendar-container">
                <DashboardMiniCalendar householdId={householdId} />
            </div>
            <HomepageCollapseCard
                title="Upcoming Events"
                color="navy"
                cardKey="events"
                scrollSelector=".upcoming-events"
            >
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