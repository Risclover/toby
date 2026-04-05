import { useHabitModal } from "@/contexts";
import { HabitModal } from "@/features/Habits/components/HabitModal";
import { useAuthenticateQuery, useCompleteHabitMutation, useGetUserHabitsQuery, useUncompleteHabitMutation } from "@/store"
import { Button, Checkbox, Group, Transition } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { skipToken } from "@reduxjs/toolkit/query";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export const HomepageHabits = () => {
    const navigate = useNavigate();
    const { data: user } = useAuthenticateQuery();
    const { data: habits } = useGetUserHabitsQuery(user?.id ?? skipToken);
    const { openModal } = useHabitModal();
    const [checked, setChecked] = useState<Set<number>>(() =>
        new Set(habits?.filter(h => h.isCompletedToday).map(h => h.id))
    );
    const [completeHabit] = useCompleteHabitMutation();
    const [uncompleteHabit] = useUncompleteHabitMutation();
    const listRef = useRef<HTMLDivElement>(null);
    const prevLengthRef = useRef(habits?.length ?? 0);

    // Scroll to new habit once in DOM. setTimeout unreliable — races against RTK Query + React render.
    useEffect(() => {
        if (!habits) return;
        console.log("habits length:", habits.length, "prev:", prevLengthRef.current);
        if (habits.length > prevLengthRef.current) {
            const items = listRef.current?.querySelectorAll("li");
            console.log("items found:", items?.length, "last:", items?.[items.length - 1]);
            const last = items?.[items.length - 1];
            last?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
        prevLengthRef.current = habits.length;
    }, [habits]);

    useEffect(() => {
        if (!habits) return;
        setChecked(new Set(habits.filter(h => h.isCompletedToday).map(h => h.id)));
    }, [habits]);

    const toggle = async (id: number) => {
        try {
            const result = await completeHabit(id).unwrap();
            console.log("completed:", result);
        } catch (err) {
            console.error("Failed to complete habit:", err);
        }
        setChecked(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });

        notifications.show({
            message: (
                <Group justify="space-between" align="center">
                    <span>{`Completed habit '${habits?.find(h => h.id === id)?.name}!'`}</span>
                    <Button
                        size="xs"
                        color="rgb(5,5,73)"
                        variant="light"
                        onClick={() => handleUncompleteHabit(id)}
                    >
                        Undo
                    </Button>
                </Group>
            ),
            autoClose: 5000,
            color: "rgb(5, 5, 73)",
        })
    };

    const handleUncompleteHabit = async (id: number) => {
        await uncompleteHabit(id).unwrap();
        setChecked(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
        notifications.show({
            message: `Marked habit '${habits?.find(h => h.id === id)?.name}' as incomplete.`,
            autoClose: 3000,
            color: "gray",
        });
    }

    if (!habits) return null;

    return (
        <div className="homepage-habits-container">
            <div className="homepage-habits-list" ref={listRef}>
                <ul>
                    {habits.map(habit => (
                        <Transition
                            key={habit.id}
                            mounted={!checked.has(habit.id)}
                            transition={{
                                in: { opacity: 1, transform: 'translateY(0)' },
                                out: { opacity: 0, transform: 'translateY(-6px)' },
                                common: { transformOrigin: 'top' },
                                transitionProperty: 'opacity, transform',
                            }}
                            duration={700}
                            timingFunction="ease-in"
                        >
                            {styles => (
                                <li className="homepage-habit-row" style={styles} onClick={() => toggle(habit.id)}>
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
                            )}
                        </Transition>
                    ))}
                </ul>
            </div>
            <div className="homepage-habits-footer">
                <Button size="compact-sm" fw={500} color="var(--mantine-color-grape-7)" c="white" radius="xl" onClick={() => openModal()}>+ Add new habit</Button>
                <Button p={0} size="xs" fw={400} variant="transparent" radius="xl" color="var(--mantine-color-grape-7)" onClick={() => navigate(`/profile/${user.id}?tab=habits`)}>View all →</Button>
            </div>
            <HabitModal />
        </div >
    )
}