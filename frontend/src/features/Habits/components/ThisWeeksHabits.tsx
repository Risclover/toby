import { habitSlice, useAuthenticateQuery, useGetUserHabitsQuery, type Habit } from "@/store";
import { SingleWeeklyHabit } from "./SingleWeeklyHabit"
import dayjs from "dayjs";
import { useParams } from "react-router-dom";

type Props = {
    habits: Habit[];
}
export const ThisWeeksHabits = ({ habits }: Props) => {
    if (!habits) return null;
    return (
        <div className="this-weeks-habits">
            {[...habits]
                .sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf())
                .map((habit) => <SingleWeeklyHabit key={habit.id} habit={habit} />)
            }
        </div>
    )
}