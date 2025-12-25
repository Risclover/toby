import { Announcements } from "@/features/Announcements/components/Announcements"
import { useAuthenticateQuery } from "@/store/authSlice"

export const MobileAnnouncementsFull = () => {
    const { data: user } = useAuthenticateQuery();
    return (
        <div className="mobile-announcements-full">
            <Announcements householdId={user?.householdId} maxDisplayed={10} fullPage={true} />
        </div>
    )
}