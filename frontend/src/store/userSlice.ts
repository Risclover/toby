import type { Task } from ".";
import { apiSlice } from "./apiSlice";
import { authSlice } from "./authSlice";
import { householdSlice } from "./householdSlice";
import type { MoodKey } from "./moodSlice";
import type { Reminder } from "./reminderSlice";

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

export type OverdueTask = {
    id: number;
    task: Task;
    title: string;
    due_date: string;
    tasklist_id: number;
    tasklist_title: string;
}

export const userSlice = apiSlice.injectEndpoints({
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

        getUserTaskStats: builder.query<{
            overdue: { id: number; title: string; due_date: string; tasklist_id: number; tasklist_name: string }[];
            due_today: { id: number; title: string; due_date: string; tasklist_id: number; tasklist_name: string }[];
            due_soon: { id: number; title: string; due_date: string; tasklist_id: number; tasklist_name: string }[];
        },
            number
        >({
            query: (userId) => `/users/${userId}/task_stats`,
            providesTags: (result, error, userId) => [{ type: "UserTaskStats", id: userId }],
        }),

        updateTimezone: builder.mutation<{ id: number; timezone: string }, string>({
            query: (timezone) => ({
                url: "/users/me/timezone",
                method: "PUT",
                body: { timezone },
            }),
            async onQueryStarted(timezone, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;

                    // Update the cached current user in authSlice
                    dispatch(
                        authSlice.util.updateQueryData("authenticate", undefined, (draft: any) => {
                            draft.timezone = data.timezone;
                        })
                    );

                    // Optional: update the getUser cache if components rely on that
                    if (data.id) {
                        dispatch(
                            userSlice.util.updateQueryData("getUser", data.id, (draft: any) => {
                                draft.timezone = data.timezone;
                            })
                        );
                    }
                } catch (err) {
                    console.error("Failed to update timezone:", err);
                }
            },
        }),

        getUserProfileStats: builder.query<{ tasksCompleted: number; checkinPct: number; checkinStreak: number; }, number>({
            query: (userId) => `/users/profile/${userId}`,
            providesTags: (_result, _error, userId) => [{ type: "User", id: userId }],
        }),
    }),
});

export const {
    useGetUserQuery,
    useGetAllUsersQuery,
    useCheckinMutation,
    useUpdateUserDetailsMutation,
    useUpdatePointsMutation,
    useUploadImgMutation,
    useGetUserMoodQuery,
    useGetUserTaskStatsQuery,
    useUpdateTimezoneMutation,
    useGetUserProfileStatsQuery,
} = userSlice;
