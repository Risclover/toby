import { apiSlice } from "./apiSlice";
import type { MoodKey } from "./moodSlice";

type UploadImgArgs = {
    userId: number | undefined;
    imgType: "profile" | "banner";
    file: File;               // <-- the actual file to upload
};

type UploadImgResponse = { url: string };
type UserMoodResponse = {
    userId: number;
    mood: MoodKey | null;
    // include these if your backend returns them:
    name?: string;
    profileImg?: string | null;
};

export const userSlice = apiSlice.enhanceEndpoints({ addTagTypes: ["User"] }).injectEndpoints({
    endpoints: (builder) => ({
        getUser: builder.query({
            query: (userId) => `/users/${userId}`,
            providesTags: (result, error, userId) => {
                void result; void error;
                return [{ type: "User", id: userId }]
            }
        }),
        getAllUsers: builder.query({
            query: () => `/users/`,
            providesTags: (result, error, userId) => {
                void result; void error;
                return [{ type: "User", id: userId }]
            }
        }),
        // 1. Daily Checkin
        checkin: builder.mutation<{ message: string }, number | string | undefined>({
            query: (userId) => ({
                url: `/users/${userId}/checkin`,
                method: "PUT",
            }),
            invalidatesTags: (result, error, userId) => {
                void result; void error;
                return [{ type: "User", id: userId }]
            }
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

        uploadImg: builder.mutation<UploadImgResponse, UploadImgArgs>({
            query: ({ userId, imgType, file }) => {
                const form = new FormData();
                form.append("image", file);        // <-- key must be "image" for your route

                return {
                    url: `/users/${userId}/img/${imgType}`,
                    method: "POST",
                    body: form,                      // <-- let the browser set Content-Type
                    // do NOT set headers: { "Content-Type": "multipart/form-data" }
                };
            },
            invalidatesTags: (_result, _error, { userId }) => [
                { type: "User", id: userId },      // if you tag users by id
                "User",                            // fallback if you only have a generic tag
            ],
        }),

        getUserMood: builder.query<UserMoodResponse, number>({
            query: (userId) => `/users/${userId}/mood`,
            // queries should PROVIDE tags, not invalidate
            providesTags: (_result, _error, userId) => [{ type: "User", id: userId }],
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
    useUploadImgMutation,
    useGetUserMoodQuery
} = userSlice;
