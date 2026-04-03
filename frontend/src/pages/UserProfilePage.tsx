import { MobileHomeNavGrid } from "@/components"
import { UserProfileHeader } from "@/features/UserProfile/components/UserProfileHeader"
import { UserProfileNavGrid } from "@/features/UserProfile/components/UserProfileNavGrid"
import { MobileLayout } from "@/layout"
import "../features/UserProfile/styles/UserProfile.css"
import { Tabs } from "@mantine/core"
import { UserProfileMainTab } from "@/features/UserProfile/components/ UserProfileMainTab"
import { UserProfileHabitsTab } from "@/features/UserProfile/components/UserProfileHabitsTab"
import { useState } from "react"
import { useParams } from "react-router-dom"
import { UserProfileHeaderSkeleton } from "@/features/UserProfile/components/UserProfileHeaderSkeleton"
import { useGetHouseholdQuery, useGetUserQuery } from "@/store"

export const UserProfilePage = () => {
    const { userId } = useParams();
    const { data: user, isLoading: isLoadingUser } = useGetUserQuery(userId)
    const { data: household, isLoading } = useGetHouseholdQuery(user?.householdId, {
        skip: !user?.householdId
    })
    const titleComponent = isLoading || isLoadingUser ? <UserProfileHeaderSkeleton /> : <UserProfileHeader />
    return (
        <MobileLayout titleComponent={titleComponent}>
            <Tabs key={userId} defaultValue="profile">
                <UserProfileNavGrid />
                <UserProfileMainTab />
                <UserProfileHabitsTab />
            </Tabs>
        </MobileLayout>
    )
}