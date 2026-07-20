import { MobileHomeNavGrid } from "@/components"
import { FullPageCalendar } from "@/features/Events/components/CalendarPage/FullPageCalendar";
import { useIsSmallScreen } from "@/hooks"
import { MobileLayout } from "@/layout"
import { Schedule } from "@mantine/schedule";

export const CalendarPage = () => {
    const isSmall = useIsSmallScreen(768);

    const titleComponent = <div className='mobile-home-family-title'>
        <div className="title-announcements">
            <h1>Calendar</h1>
        </div>
    </div>

    return (
        <MobileLayout titleComponent={titleComponent}>
            <MobileHomeNavGrid activeTab={2} />
            <div className={`mobile-tasklists-content${isSmall ? " content-padding" : ""}`}>
                {/* Empty state */}
                <FullPageCalendar />
            </div>
        </MobileLayout>
    )
}