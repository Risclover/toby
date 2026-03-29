import { useAuthenticateQuery, useGetUserHabitsQuery, useGetUserQuery, type Habit } from "@/store"
import { SingleHabit } from "./SingleHabit"
import { TodaysCompletedHabits } from "./TodaysCompletedHabits";
import { useParams } from "react-router-dom";

type Props = {
    habits: Habit[];
}
export const TodaysHabits = ({ habits }: Props) => {
    if (!habits) return null;
    return (
        <div className="todays-habits">
            {habits && [...habits]
                .sort((a, b) => {
                    if (a.isCompletedToday !== b.isCompletedToday) {
                        return a.isCompletedToday ? 1 : -1;
                    }
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                })
                .map(habit => (
                    <SingleHabit key={habit.id} habit={habit} id={habit.id} name={habit.name} description={habit.description} color={habit.color} isPrivate={habit.isPrivate} />
                ))
            }
        </div>
    )
}