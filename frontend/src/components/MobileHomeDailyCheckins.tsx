import { HouseholdCheckinsMini } from "@/features/Checkins/components/HouseholdCheckinsMini"

export const MobileHomeDailyCheckins = () => {
    return (
        <div className="mobile-home-daily-checkins">
            {/* <h2>Daily Checkins</h2> */}
            <div className="daily-checkins-map">
                <HouseholdCheckinsMini />
            </div>
        </div>
    )
}