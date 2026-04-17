import { MobileHomeNavGrid } from "@/components"
import { UserProfileHeader } from "@/features/UserProfile/components/UserProfileHeader"
import { UserProfileNavGrid } from "@/features/UserProfile/components/UserProfileNavGrid"
import { MobileLayout } from "@/layout"
import "../features/UserProfile/styles/UserProfile.css"
import { Tabs } from "@mantine/core"
import { UserProfileMainTab } from "@/features/UserProfile/components/ UserProfileMainTab"
import { UserProfileHabitsTab } from "@/features/UserProfile/components/UserProfileHabitsTab"
import { useState } from "react"
import { useParams, useSearchParams } from "react-router-dom"
import { UserProfileHeaderSkeleton } from "@/features/UserProfile/components/UserProfileHeaderSkeleton"
import { useGetHouseholdQuery, useGetUserQuery } from "@/store"
import { UserProfileNotesTab } from "@/features/UserProfile/components/UserProfileNotesTab"

export const UserProfilePage = ({ defaultTab }: { defaultTab: string }) => {
    const { userId } = useParams();
    const [searchParams] = useSearchParams();
    const { data: user, isLoading: isLoadingUser } = useGetUserQuery(userId)
    const { data: household, isLoading } = useGetHouseholdQuery(user?.householdId, {
        skip: !user?.householdId
    })

    const titleComponent = isLoading || isLoadingUser ? <UserProfileHeaderSkeleton /> : <UserProfileHeader />

    const tabToRead = (searchParams.get("tab") ?? defaultTab);

    return (
        <MobileLayout titleComponent={titleComponent}>
            <Tabs style={{ overflow: "hidden", height: "100%", borderTopLeftRadius: "1rem", borderTopRightRadius: "1rem" }} key={defaultTab} defaultValue={tabToRead}>
                <UserProfileNavGrid />
                <UserProfileMainTab />
                <UserProfileHabitsTab />
                <UserProfileNotesTab />
            </Tabs>
        </MobileLayout>
    )
}