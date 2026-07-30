import { Box, Button, Collapse, Group, Text } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks";
import { RightClosedChevronIcon } from "@/assets/icons/RightClosedChevronIcon";
import type { Habit } from "@/store";
import { SingleHabit } from "./SingleHabit";

export const TodaysCompletedHabits = ({ habits }: { habits: Habit[] | undefined }) => {
    const [opened, { toggle }] = useDisclosure(false);

    return (
        <div className="completed-habits-container">
            <div className="completed-habits-toggler" onClick={toggle}>Completed Habits
                <RightClosedChevronIcon size="9px" color="var(--mantine-color-dark-3)" open={opened} />
            </div>

            <Collapse expanded={opened}>
                <div className="completed-habits">
                    {habits?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(habit => <SingleHabit habit={habit} name={habit.name} description={habit.description} color={habit.color} id={habit.id} isPrivate={habit.isPrivate} />)}
                </div>
            </Collapse>
        </div>
    )
}