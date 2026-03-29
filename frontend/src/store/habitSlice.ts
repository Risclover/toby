import { apiSlice } from "./apiSlice";

export interface Habit {
    id: number;
    userId: number;
    name: string;
    description?: string | null | undefined;
    color: string;
    isPrivate: boolean;
    isActive: boolean;
    createdAt: string;
    isCompletedToday: boolean;
}

export interface HabitCompletion {
    habitId: number;
    localDate: string;
    completed: boolean;
}

interface CreateHabitArgs {
    name: string;
    description?: string;
    isPrivate?: boolean;
}

interface UpdateHabitArgs {
    habitId: number;
    name?: string;
    description?: string;
    isPrivate?: boolean;
}

export const habitSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getUserHabits: builder.query<Habit[], number>({
            query: (userId) => `/users/${userId}/habits`,
            providesTags: (result, _error, userId) =>
                result
                    ? [
                        ...result.map(({ id }) => ({ type: "Habit" as const, id })),
                        { type: "Habit", id: `USER-${userId}` },
                    ]
                    : [{ type: "Habit", id: `USER-${userId}` }],
        }),

        createHabit: builder.mutation<Habit, CreateHabitArgs>({
            query: (body) => ({
                url: "/habits",
                method: "POST",
                body,
            }),
            invalidatesTags: (_result, _error, { }) => [
                { type: "Habit" },
            ],
        }),

        updateHabit: builder.mutation<Habit, UpdateHabitArgs>({
            query: ({ habitId, ...body }) => ({
                url: `/habits/${habitId}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: (_result, _error, { habitId }) => [
                { type: "Habit", id: habitId },
            ],
        }),

        deleteHabit: builder.mutation<{ message: string }, number>({
            query: (habitId) => ({
                url: `/habits/${habitId}`,
                method: "DELETE",
            }),
            invalidatesTags: (_result, _error, habitId) => [
                { type: "Habit", id: habitId },
            ],
        }),

        completeHabit: builder.mutation<HabitCompletion, number>({
            query: (habitId) => ({
                url: `/habits/${habitId}/complete`,
                method: "POST",
                body: {},
            }),
            invalidatesTags: (_result, _error, habitId) => [
                { type: "Habit", id: habitId },
            ],
        }),

        uncompleteHabit: builder.mutation<HabitCompletion, number>({
            query: (habitId) => ({
                url: `/habits/${habitId}/complete`,
                method: "DELETE",
                body: {},
            }),
            invalidatesTags: (_result, _error, habitId) => [
                { type: "Habit", id: habitId },
            ],
        }),
    }),
});

export const {
    useGetUserHabitsQuery,
    useCreateHabitMutation,
    useUpdateHabitMutation,
    useDeleteHabitMutation,
    useCompleteHabitMutation,
    useUncompleteHabitMutation,
} = habitSlice;