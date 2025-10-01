import { useGetAnnouncementsQuery } from "@/store/announcementSlice"
import "../styles/Announcements.css"

type Props = {
    householdId: number;
}

export const Announcements = ({ householdId }: Props) => {
    const { data: announcements } = useGetAnnouncementsQuery({ householdId });

    return <div>
        {announcements?.map(announcement => <div>{announcement.text}</div>)}
    </div>
}