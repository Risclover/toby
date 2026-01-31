import { Announcements } from "@/features/Announcements/components/Announcements"
import { useAuthenticateQuery } from "@/store/authSlice"

type Props = {
    searchValue: string;
    sortOption: "Newest" | "Oldest" | "Important first" | null;
    filters: {
        importance: "all" | "important";
        creatorId: number | null;
        time: "today" | "7days" | "30days" | "all";
    };
}
export const MobileAnnouncementsFull = ({ searchValue, sortOption, filters }: Props) => {
    const { data: user } = useAuthenticateQuery();

    return (
        <div className="mobile-announcements-full">
            <Announcements householdId={user?.householdId} maxDisplayed={10} fullPage={true} searchValue={searchValue} sortOption={sortOption} filters={filters} />
        </div>
    )
}