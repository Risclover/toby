import { HabitModal } from "@/features/Habits/components/HabitModal";
import { TodaysHabits } from "@/features/Habits/components/TodaysHabits";
import { useAuthenticateQuery, useGetUserHabitsQuery } from "@/store";
import { ActionIcon, Button, SegmentedControl, Tabs } from "@mantine/core"
import type React from "react"
import { useState } from "react";
import "../../Habits/styles/Habits.css";
import { useHabitModal } from "@/contexts";
import { ThisWeeksHabits } from "@/features/Habits/components/ThisWeeksHabits";
import { useParams } from "react-router-dom";
import { useGetUserSettingsQuery } from "@/store/userSettingsSlice";
import { HabitsPrivate } from "@/features/Habits/components/HabitsPrivate";
import { HabitsEmpty } from "@/features/Habits/components/HabitsEmpty";
import { PlusIcon } from "@/assets/icons/PlusIcon";
import { useIsSmallScreen } from "@/hooks";
import { MonthlyHabitView } from "@/features/Habits/components/MonthlyHabitView";

export const UserProfileHabitsTab = () => {
    const isSmall = useIsSmallScreen(425);
    const { openModal } = useHabitModal();
    const { userId } = useParams();
    const { data: user } = useAuthenticateQuery();
    const { data: habits } = useGetUserHabitsQuery(Number(userId));
    const { data: userSettings } = useGetUserSettingsQuery(Number(userId))
    const [view, setView] = useState<"today" | "week" | "month">("today");

    const myProfilePage = user?.id === Number(userId);
    if (!habits) return null;

    return (
        <Tabs.Panel value="habits" className="user-profile-main-container">
            {userSettings?.settings.habitsPrivacyMode === "all_private" && !myProfilePage ? <HabitsPrivate /> : myProfilePage && habits?.length === 0 ? <HabitsEmpty /> :
                <>
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
                    {view === "today" && <TodaysHabits habits={habits} />}
                    {view === "week" && <ThisWeeksHabits habits={habits} />}
                    {view === "month" && <MonthlyHabitView habits={habits} />}
                    {myProfilePage && <div className="add-habit-btn"><ActionIcon color="rgb(5, 5, 73)" size={isSmall ? "4rem" : "5rem"} p={0} w="auto" onClick={() => openModal()} radius="5rem"><PlusIcon size={isSmall ? "1.5rem" : "2rem"} color="white" /></ActionIcon></div>}
                </>}
            <HabitModal />
        </Tabs.Panel >
    )
}