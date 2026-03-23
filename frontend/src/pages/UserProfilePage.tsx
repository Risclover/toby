import { MobileHomeNavGrid } from "@/components"
import { UserProfileHeader } from "@/features/UserProfile/components/UserProfileHeader"
import { UserProfileNavGrid } from "@/features/UserProfile/components/UserProfileNavGrid"
import { MobileLayout } from "@/layout"
import "../features/UserProfile/styles/UserProfile.css"
import { Tabs } from "@mantine/core"
import { UserProfileMainTab } from "@/features/UserProfile/components/ UserProfileMainTab"
import { UserProfileHabitsTab } from "@/features/UserProfile/components/UserProfileHabitsTab"
import { useState } from "react"

export const UserProfilePage = () => {
    const [showCreateHabitModal, setShowCreateHabitModal] = useState(false);
    const titleComponent = <UserProfileHeader />
    return (
        <MobileLayout titleComponent={titleComponent}>
            <Tabs defaultValue="profile">
                <UserProfileNavGrid />
                <UserProfileMainTab />
                <UserProfileHabitsTab />
            </Tabs>
        </MobileLayout>
    )
}