import { useState } from "react";
import { SimpleGrid } from "@mantine/core";
import { useAuthenticateQuery } from "@/store";
import { useGetUserHabitsQuery, useGetMonthlyCompletionsQuery, type Habit } from "@/store/habitSlice";
import { HabitMonthCard } from "./HabitMonthCard";
import { useParams } from "react-router-dom";
import { useIsSmallScreen } from "@/hooks";

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

type Props = {
    habits: Habit[];
}

export function MonthlyHabitView({ habits }: Props) {
    const isSmall = useIsSmallScreen(425);
    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth() + 1); // 1-indexed
    const { userId } = useParams();


    const { data: completionsByHabit = {} } = useGetMonthlyCompletionsQuery(
        { year, month, userId: Number(userId) },
        { skip: !Number(userId) }
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
                display: "flex", alignItems: "center", justifyContent: "space-between", padding: ".25rem 1rem",
                gap: 12, marginBottom: isSmall ? ".5rem" : "1rem", background: "white", borderRadius: isSmall ? 0 : ".5rem", boxShadow: "var(--mantine-shadow-xs)"
            }}>
                <button onClick={prev} style={{ padding: "5px 12px", fontSize: 15 }}>&#8592;</button>
                <span style={{
                    fontSize: isSmall ? 15 : 20, fontWeight: 500,
                    color: "var(--color-text-primary)",
                    minWidth: 160, textAlign: "center",
                }}>
                    {MONTHS[month - 1]} {year}
                </span>
                <button onClick={next} disabled={isNextDisabled} style={{ padding: "5px 12px", fontSize: isSmall ? 15 : 20 }}>
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