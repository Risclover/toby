import { ChevronDownIcon } from "@/assets/icons/ChevronDownIcon";
import { useIsSmallScreen } from "@/hooks";
import { habitSlice, type Habit } from "@/store"
import { getLightColor } from "@/utils/getLightColor";
import { Checkbox, Collapse } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import dayjs from "dayjs";
import { useState } from "react";

type Props = {
    habit: Habit;
}

const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
export const SingleWeeklyHabit = ({ habit }: Props) => {
    const isSmall = useIsSmallScreen(425);
    const [opened, { toggle }] = useDisclosure(false);

    const getWeekDays = () => {
        const startOfWeek = dayjs().startOf("week");
        return Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, "day"));
    }

    const weekDays = getWeekDays();
    const completedSet = new Set(habit.completionsThisWeek);

    return (
        <div className="single-weekly-habit" style={{ borderLeft: `4px solid ${habit.color}` }}>
            {habit.description
                ?
                <div className="single-weekly-habit-details">
                    <div className="single-weekly-habit-details-top" onClick={toggle}>
                        <div className={`single-weekly-habit-name${isSmall ? " habit-name-small" : ""}`}>
                            {habit.name}
                        </div>
                        <span className={`chevron-down-icon${opened ? " icon-turned" : ""}`}><ChevronDownIcon size={isSmall ? "1.25rem" : "1.5rem"} color="var(--mantine-color-gray-6)" /></span>
                    </div>
                    <Collapse in={opened}>
                        <div className={`single-weekly-habit-description${isSmall ? " habit-desc-small" : ""}`}>{habit.description}</div>
                    </Collapse>
                </div>
                :
                <div className="single-weekly-habit-details">
                    <div className={`single-weekly-habit-name${isSmall ? " habit-name-small" : ""}`}>{habit.name}</div>
                </div>
            }
            <div className="single-weekly-habit-days">
                <div className="single-weekly-habit-day-labels">
                    {weekDays.map((d, i) => (
                        <span key={i}>
                            {DAY_ABBR[i]}
                        </span>
                    ))}
                </div>
                <div className="single-weekly-habit-day-checks">
                    {weekDays.map(day => {
                        const isCompleted = completedSet.has(day.format("YYYY-MM-DD"));
                        return <Checkbox styles={{ input: { borderColor: getLightColor(habit.color, .5) }, icon: { width: isSmall ? ".75rem" : "1rem" } }} size={isSmall ? "lg" : "xl"} radius="xl" color={habit.color} checked={isCompleted} />
                    })}
                </div>
            </div>
        </div>
    )
}