import { HabitModal } from "@/features/Habits/components/HabitModal";
import { TodaysHabits } from "@/features/Habits/components/TodaysHabits";
import { useAuthenticateQuery, useGetUserHabitsQuery } from "@/store";
import { Button, SegmentedControl, Tabs } from "@mantine/core"
import type React from "react"
import { useState } from "react";
import "../../Habits/styles/Habits.css";
import { useHabitModal } from "@/contexts";
import { ThisWeeksHabits } from "@/features/Habits/components/ThisWeeksHabits";

export const UserProfileHabitsTab = () => {
    const { openModal } = useHabitModal();
    const [showCreateHabitModal, setShowCreateHabitModal] = useState(false);
    const { data: user } = useAuthenticateQuery();
    const { data: habits } = useGetUserHabitsQuery(user?.id);

    const [view, setView] = useState<"today" | "week" | "month">("today");

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
            {view === "today" && <TodaysHabits />}
            {view === "week" && <ThisWeeksHabits />}
            <Button onClick={() => openModal()}>Create a habit</Button>
        </Tabs.Panel>
    )
}