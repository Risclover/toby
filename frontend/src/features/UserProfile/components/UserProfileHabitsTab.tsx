import { HabitModal } from "@/features/Habits/components/HabitModal";
import { TodaysHabits } from "@/features/Habits/components/TodaysHabits";
import { useAuthenticateQuery, useGetUserHabitsQuery } from "@/store";
import { Button, SegmentedControl, Tabs } from "@mantine/core"
import type React from "react"
import { useState } from "react";
import "../../Habits/styles/Habits.css";
import { useHabitModal } from "@/contexts";
import { ThisWeeksHabits } from "@/features/Habits/components/ThisWeeksHabits";
import { useParams } from "react-router-dom";
import { useGetUserSettingsQuery } from "@/store/userSettingsSlice";
import { HabitsPrivate } from "@/features/Habits/components/HabitsPrivate";

export const UserProfileHabitsTab = () => {
    const { openModal } = useHabitModal();
    const { userId } = useParams();
    const { data: habits } = useGetUserHabitsQuery(Number(userId));
    const { data: userSettings } = useGetUserSettingsQuery(Number(userId))
    const [view, setView] = useState<"today" | "week" | "month">("today");
    console.log('USER SETTINGS:', userSettings)
    if (userSettings?.settings.habitsPrivacyMode === "all_private") return <HabitsPrivate />;

    if (!habits) return null;
    return (
        <Tabs.Panel value="habits" className="user-profile-main-container">

            <div className="habits-control-container">
                <SegmentedControl
                    value={view}
                    onChange={(val) => setView(val as "today" | "week" | "month")}
                    fullWidth
                    styles={{
                        root: {
                            borderRadius: ".5rem",
                            boxShadow: "var(--mantine-shadow-xs)",
                            backgroundColor: "white",
                            margin: "0 auto"
                        },
                        label: {
                            paddingLeft: "1rem",
                            paddingRight: "1rem",
                            padding: ".325rem 1rem",
                            fontWeight: "500",
                            fontSize: "13px"
                        }
                    }}
                    color="rgb(46, 46, 106)"
                    data={[
                        { label: "Today", value: "today" },
                        { label: "This week", value: "week" },
                        { label: "This month", value: "month" }
                    ]}
                />
            </div>
            <HabitModal />
            {view === "today" && <TodaysHabits habits={habits} />}
            {view === "week" && <ThisWeeksHabits habits={habits} />}
            <Button onClick={() => openModal()}>Create a habit</Button>
        </Tabs.Panel>
    )
}