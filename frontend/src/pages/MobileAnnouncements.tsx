import { MobileLayout } from "@/layout/MobileLayout"

export const MobileAnnouncements = () => {
    const title = <div>Announcements</div>
    return (
        <MobileLayout titleComponent={title}>
            <div>Hello</div>
        </MobileLayout>
    )
}