import { useHabitModal } from "@/contexts";
import { HabitModal } from "@/features/Habits/components/HabitModal";
import { showHabitCompleteToast } from "@/features/Habits/utils/showHabitCompleteToast";
import { showHabitIncompleteToast } from "@/features/Habits/utils/showHabitIncompleteToast";
import { useAuthenticateQuery, useCompleteHabitMutation, useGetUserHabitsQuery, useUncompleteHabitMutation } from "@/store"
import { Box, Button, Checkbox, Group, Skeleton, Stack, Transition } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { skipToken } from "@reduxjs/toolkit/query";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { KittyNotification } from "../KittyNotification";
import { KittyIcons } from "@/assets";

type Props = {
    isReady: boolean;
}
export const HomepageHabits = ({ isReady }: Props) => {
    const navigate = useNavigate();
    const { data: user } = useAuthenticateQuery();
    const { data: habits } = useGetUserHabitsQuery(user?.id ?? skipToken);
    const { openModal } = useHabitModal();
    const [checked, setChecked] = useState<Set<number> | null>(null);

    const [completeHabit] = useCompleteHabitMutation();
    const [uncompleteHabit] = useUncompleteHabitMutation();
    const listRef = useRef<HTMLDivElement>(null);
    const prevLengthRef = useRef(habits?.length ?? 0);
    const [showAllDone, setShowAllDone] = useState(false);
    const [allDoneExiting, setAllDoneExiting] = useState(false);

    useEffect(() => {
        if (checked && habits?.every(h => checked.has(h.id)) && habits.length > 0) {
            const timer = setTimeout(() => setShowAllDone(true), 200);
            return () => clearTimeout(timer);
        } else if (showAllDone) {
            // Exit animation before habits re-appear
            setShowAllDone(false);
            setAllDoneExiting(true);
            const timer = setTimeout(() => setAllDoneExiting(false), 200);
            return () => clearTimeout(timer);
        }
    }, [checked, habits]);
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

        const habit = habits?.find(h => h.id === id);
        if (!habit) return;
        const name = habit.name;
        KittyNotification({
            title: "Habit marked incomplete",
            message: <>"<strong style={{ fontWeight: 500 }}>{name}</strong>" has returned. Go show it who's boss!</>,
            color: "rgb(154, 221, 166)",
            icon: KittyIcons.Frustrated
        })
    };


    const handleUncompleteHabit = async (id: number) => {
        await uncompleteHabit(id).unwrap();
        setChecked(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });

        const habit = habits?.find(h => h.id === id);
        if (!habit) return;
        const name = habit.name;
        KittyNotification({
            title: "Habit completed",
            message: <>"<strong style={{ fontWeight: 500 }}>{name}</strong>" is done for the day. Keep it up, champ!</>,
            color: "rgb(154, 221, 166)",
            icon: KittyIcons.Celebrate
        })
    }


    const handleToggle = async (id: number) => {
        const habit = habits?.find(h => h.id === id);
        if (!habit) return;

        const name = habit.name;
        try {
            if (checked?.has(id)) {
                await uncompleteHabit(habit.id).unwrap();
                KittyNotification({
                    title: "Habit marked incomplete",
                    message: <>"<strong style={{ fontWeight: 500 }}>{name}</strong>" has returned. Go show it who's boss!</>,
                    color: "rgb(154, 221, 166)",
                    icon: KittyIcons.Frustrated
                })
                setChecked(false);
            } else {
                await completeHabit(habit.id).unwrap();
                KittyNotification({
                    title: "Habit completed",
                    message: <>"<strong style={{ fontWeight: 500 }}>{name}</strong>" is done for the day. Keep it up, champ!</>,
                    color: "rgb(154, 221, 166)",
                    icon: KittyIcons.Celebrate
                })

            }
        } catch (error) {
            KittyNotification({
                title: "Whoops - something went wrong",
                message: <>Couldn't change the status of "<strong style={{ fontWeight: 500 }}>{name}</strong>". Refresh and try again.</>,
                color: "rgb(234, 118, 118)",
                icon: KittyIcons.Cry
            })
        }
    };


    if (!isReady || !habits) return <HomepageHabitsSkeleton />;

    return (
        // <><HomepageHabitsSkeleton /></>
        <div className="homepage-habits-container">
            <div className="homepage-habits-list" ref={listRef}>
                <div className="homepage-habits-empty-state" style={{ zIndex: habits.length === 0 ? 10 : -1, opacity: habits.length === 0 ? 1 : 0, transition: "opacity 200ms" }}>
                    You don't have any habits to track. Why don't you create one?
                </div>

                <div className="homepage-habits-empty-state" style={{ zIndex: showAllDone ? 10 : -1, opacity: showAllDone ? 1 : 0, transition: "opacity 200ms" }}>
                    All of today's habits are done. Way to go! 🎉
                </div>

                <ul className="homepage-habits-ul">

                    {checked && habits.map(habit => (
                        <Transition
                            key={habit.id}
                            mounted={!checked.has(habit.id)}
                            transition="fade-down"
                            duration={300}
                            timingFunction="linear"
                        >
                            {styles => (
                                <li className="homepage-habit-row" style={styles} onClick={() => handleToggle(habit.id)}>
                                    <div className="homepage-habit-row-color-bar" style={{ background: habit.color }}></div>
                                    <div className="homepage-habit-main">
                                        <div className="homepage-habit-left">
                                            <Checkbox
                                                checked={checked.has(habit.id)}
                                                onChange={() => handleToggle(habit.id)}
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

const HomepageHabitsSkeleton = () => {
    return (
        <div className="homepage-habits-container" style={{ width: "100%" }}>
            <div className="homepage-habits-list">
                <ul>
                    {[...Array(5)].map((_, i) => (
                        <li className="homepage-habit-row">
                            <div className="homepage-habit-row-color-bar skeleton" style={{ flexShrink: 0, borderLeft: `4px solid var(--mantine-color-gray-3)` }} />
                            <div className="homepage-habit-main" style={{ width: "100%" }}>
                                <div className="homepage-habit-left">
                                    <Skeleton circle w={16} h={16} />
                                </div>
                                <div className="homepage-habit-right" style={{ gap: "0.25rem", width: "100%" }}>
                                    <Skeleton w="120px" h={8} />
                                    <Skeleton w="70%" h={6} style={{ marginTop: "2px" }} />
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}