import { useAuthenticateQuery, useGetUserHabitsQuery } from "@/store"
import { Button, Checkbox } from "@mantine/core";
import { skipToken } from "@reduxjs/toolkit/query";
import { useState } from "react";

export const HomepageHabits = () => {
    const { data: user } = useAuthenticateQuery();
    const { data: habits } = useGetUserHabitsQuery(user?.id ?? skipToken);

    const [checked, setChecked] = useState<Set<number>>(new Set());

    const toggle = (id: number) => {
        setChecked(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        })
    }

    if (!habits) return null;

    return (
        <div className="homepage-habits-container">
            <div className="homepage-habits-list">
                <ul>
                    {habits.map(habit => (
                        <li className="homepage-habit-row" key={habit.id} onClick={() => toggle(habit.id)}>
                            <div className="homepage-habit-row-color-bar" style={{ background: habit.color }}></div>
                            <div className="homepage-habit-main">
                                <div className="homepage-habit-left">
                                    <Checkbox
                                        checked={checked.has(habit.id)}
                                        onChange={() => toggle(habit.id)}
                                        onClick={e => e.stopPropagation()}
                                        color={habit.color}
                                        radius="xl"
                                        size="xs"
                                        styles={{
                                            input: {
                                                borderColor: habit.color,
                                                cursor: "pointer"
                                            }
                                        }}
                                    />
                                </div>
                                <div className="homepage-habit-right">
                                    {habit.name}
                                    {habit.description ? <span>{habit.description}</span> : null}
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="homepage-habits-footer">
                <Button size="compact-sm" fw={500} color="var(--mantine-color-grape-7)" c="white" radius="xl">+ Add new habit</Button>
                <Button p={0} size="xs" fw={400} variant="transparent" radius="xl" color="var(--mantine-color-grape-7)">View all →</Button>
            </div>
        </div>
    )
}