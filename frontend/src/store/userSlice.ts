import { apiSlice } from "./apiSlice";

export const userSlice = apiSlice.enhanceEndpoints({ addTagTypes: ["User"] }).injectEndpoints({
    endpoints: (builder) => ({
        getUser: builder.query({
            query: (userId) => `/users/${userId}`,
            providesTags: (result, error, userId) => [{ type: "User", id: userId }],
        }),
        getAllUsers: builder.query({
            query: () => `/users/`,
            providesTags: (result, error, userId) => [{ type: "User", id: userId }],
        }),
        // 1. Daily Checkin
        checkin: builder.mutation<{ message: string }, number | string | undefined>({
            query: (userId) => ({
                url: `/users/${userId}/checkin`,
                method: "PUT",
            }),
            invalidatesTags: (result, error, userId) => [{ type: "User", id: userId }],
        }),

        // 2. Update user details (display name, tagline, mood)
        updateUserDetails: builder.mutation<
            { user: any },
            { id: number; display_name?: string; tagline?: string; mood?: string }
        >({
            query: ({ id, ...patch }) => ({
                url: `/users/${id}`,
                method: "PUT",
                body: patch,
            }),
            invalidatesTags: ["User"],
        }),

        // 3. Track habit (example mutation, you may adapt)
        trackHabit: builder.mutation({
            query: ({ habitId, userId, completed }) => ({
                url: `/habits/${habitId}/track`,
                method: "POST",
                body: { userId, completed },
            }),
            invalidatesTags: ["User"],
        }),

        // 4. Create habit
        createHabit: builder.mutation({
            query: ({ userId, habitName, frequency }) => ({
                url: `/habits`,
                method: "POST",
                body: { userId, habitName, frequency },
            }),
            invalidatesTags: ["User"],
        }),

        // 5. Update points
        updatePoints: builder.mutation({
            query: ({ userId, points }) => ({
                url: `/users/${userId}/points`,
                method: "PUT",
                body: { points },
            }),
            invalidatesTags: ["User"],
        }),
    }),
});

export const {
    useGetUserQuery,
    useGetAllUsersQuery,
    useCheckinMutation,
    useUpdateUserDetailsMutation,
    useTrackHabitMutation,
    useCreateHabitMutation,
    useUpdatePointsMutation,
} = userSlice;
