import { useState } from "react";
import { SimpleGrid } from "@mantine/core";
import { useAuthenticateQuery } from "@/store";
import { useGetUserHabitsQuery, useGetMonthlyCompletionsQuery } from "@/store/habitSlice";
import { HabitMonthCard } from "./HabitMonthCard";

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

export function MonthlyHabitView() {
    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth() + 1); // 1-indexed

    const { data: user } = useAuthenticateQuery();
    const userId = user?.id;

    const { data: habits = [] } = useGetUserHabitsQuery(userId!, { skip: !userId });

    const { data: completionsByHabit = {} } = useGetMonthlyCompletionsQuery(
        { year, month },
        { skip: !userId }
    );

    const prev = () => {
        if (month === 1) { setMonth(12); setYear(y => y - 1); }
        else setMonth(m => m - 1);
    };

    const next = () => {
        if (month === 12) { setMonth(1); setYear(y => y + 1); }
        else setMonth(m => m + 1);
    };

    const isNextDisabled =
        year > today.getFullYear() ||
        (year === today.getFullYear() && month >= today.getMonth() + 1);

    return (
        <div className="monthly-habit-view">
            {/* Month navigation */}
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 1rem",
                gap: 12, marginBottom: ".75rem", background: "white", borderRadius: ".875rem", boxShadow: "var(--mantine-shadow-xs)"
            }}>
                <button onClick={prev} style={{ padding: "5px 12px", fontSize: 15 }}>&#8592;</button>
                <span style={{
                    fontSize: 17, fontWeight: 500,
                    color: "var(--color-text-primary)",
                    minWidth: 160, textAlign: "center",
                }}>
                    {MONTHS[month - 1]} {year}
                </span>
                <button onClick={next} disabled={isNextDisabled} style={{ padding: "5px 12px", fontSize: 15 }}>
                    &#8594;
                </button>
            </div>

            {/* Habit cards */}
            <SimpleGrid type="container"
                cols={{ base: 1, '375px': 2 }}
                spacing="xs">
                {habits.map(habit => (
                    <HabitMonthCard
                        key={habit.id}
                        habit={habit}
                        completions={completionsByHabit[habit.id] ?? []}
                        year={year}
                        month={month}
                    />
                ))}
            </SimpleGrid>
        </div>
    );
}