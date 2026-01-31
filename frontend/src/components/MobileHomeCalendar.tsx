import { DashboardMiniCalendar } from "@/features/Events/components/DashboardMiniCalendar";

export const MobileHomeCalendar = () => {
    return (
        <div className="mobile-home-calendar-container">
            <DashboardMiniCalendar householdId={1} showAddEvent={false} setShowAddEvent={() => { }} />
        </div>
    )
}