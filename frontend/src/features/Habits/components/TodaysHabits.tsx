import { useAuthenticateQuery, useGetUserHabitsQuery } from "@/store"
import { SingleHabit } from "./SingleHabit"

export const TodaysHabits = () => {
    const { data: user } = useAuthenticateQuery();
    const { data: habits } = useGetUserHabitsQuery(user?.id)

    return (
        <div className="todays-habits">
            {habits && [...habits]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map(habit => (
                    <SingleHabit habit={habit} id={habit.id} name={habit.name} description={habit.description} color={habit.color} isPrivate={habit.isPrivate} />
                ))
            }
        </div>
    )
}