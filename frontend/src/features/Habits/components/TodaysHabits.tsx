import { useAuthenticateQuery, useGetUserHabitsQuery } from "@/store"
import { SingleHabit } from "./SingleHabit"

export const TodaysHabits = () => {
    const { data: user } = useAuthenticateQuery();
    const { data: habits } = useGetUserHabitsQuery(user?.id)

    return (
        <div className="todays-habits">
            {habits && habits.map(habit => (
                <SingleHabit name={habit.name} description={habit.description} color={habit.color} isPrivate={habit.isPrivate} />
            ))}
        </div>
    )
}