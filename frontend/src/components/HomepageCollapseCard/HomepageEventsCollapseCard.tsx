import { DashboardMiniCalendar, UpcomingThisWeek } from "@/features"
import { HomepageCollapseCard } from "./HomepageCollapseCard"
import { useAuthenticateQuery, useGetAllHouseholdEventsQuery, useGetHouseholdEventsQuery, useGetUserSettingsQuery } from "@/store"
import { useState } from "react";
import { AgendaView } from "@mantine/schedule";
import dayjs from "dayjs";
import { useHousehold } from "@/hooks";
import { apiEventToScheduleEvent } from "@/features/Events/utils/eventsTransform";

export const HomepageEventsCollapseCard = ({ isReady }: { isReady: boolean }) => {
    const { data: user } = useAuthenticateQuery();

    const [showAddEvent, setShowAddEvent] = useState(false);
    const { data: household } = useHousehold();
    const { data: events } = useGetAllHouseholdEventsQuery({ householdId: household?.id });

    const transformedEvents = events?.map(event => apiEventToScheduleEvent(event));

    return (
        <div className="homepage-events">
            <div className="homepage-mini-calendar-container">
                <DashboardMiniCalendar householdId={user?.householdId!} showAddEvent={showAddEvent} setShowAddEvent={setShowAddEvent} />
            </div>
            <HomepageCollapseCard title="Upcoming Events" color="rgb(5, 5, 73)" cardKey="events" scrollSelector=".upcoming-events">
                <UpcomingThisWeek isReady={isReady} householdId={user?.householdId!} />
                <div className="upcoming-events-container">
                    <AgendaView
                        rangeStart={dayjs().startOf('week').format('YYYY-MM-DD')}
                        rangeEnd={dayjs().endOf('week').format('YYYY-MM-DD')}
                        events={transformedEvents}
                    />
                </div>
            </HomepageCollapseCard>
        </div>
    )
}
