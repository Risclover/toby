import { habitSlice, useAuthenticateQuery, useGetUserHabitsQuery } from "@/store";
import { SingleWeeklyHabit } from "./SingleWeeklyHabit"
import dayjs from "dayjs";

export const ThisWeeksHabits = () => {
    const { data: user } = useAuthenticateQuery();
    const { data: habits } = useGetUserHabitsQuery(user.id);

    return (
        <div className="this-weeks-habits">
            {[...habits]
                .sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf())
                .map((habit) => <SingleWeeklyHabit key={habit.id} habit={habit} />)
            }
        </div>
    )
}