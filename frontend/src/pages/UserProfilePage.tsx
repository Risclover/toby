import { MobileHomeNavGrid } from "@/components"
import { UserProfileHeader } from "@/features/UserProfile/components/UserProfileHeader"
import { UserProfileNavGrid } from "@/features/UserProfile/components/UserProfileNavGrid"
import { MobileLayout } from "@/layout"
import "../features/UserProfile/styles/UserProfile.css"
import { Tabs } from "@mantine/core"
import { UserProfileMainTab } from "@/features/UserProfile/components/ UserProfileMainTab"

export const UserProfilePage = () => {
    const titleComponent = <UserProfileHeader />
    return (
        <MobileLayout titleComponent={titleComponent}>
            <Tabs defaultValue="profile">
                <UserProfileNavGrid />
                <UserProfileMainTab />
            </Tabs>
        </MobileLayout>
    )
}