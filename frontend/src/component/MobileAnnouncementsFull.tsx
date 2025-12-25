import { Announcements } from "@/features/Announcements/components/Announcements"
import { useAuthenticateQuery } from "@/store/authSlice"

type Props = {
    searchValue: string;
}
export const MobileAnnouncementsFull = ({ searchValue }: Props) => {
    const { data: user } = useAuthenticateQuery();

    return (
        <div className="mobile-announcements-full">
            <Announcements householdId={user?.householdId} maxDisplayed={10} fullPage={true} searchValue={searchValue} />
        </div>
    )
}