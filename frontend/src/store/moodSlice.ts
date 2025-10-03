// src/store/moodSlice.ts
import { apiSlice } from "./apiSlice";

export type MoodKey =
    | "happy" | "content" | "neutral" | "tired" | "stressed" | "sick" | "busy" | "bored"
    | "accomplished" | "proud" | "excited" | "productive" | "overwhelmed" | "motivated"
    | "cozy" | "inspired";

export type MyMood =
    | { userId: number; mood: MoodKey; }
    | { userId: number; mood: null; };

export const moodApi = apiSlice
    .enhanceEndpoints({ addTagTypes: ["Mood"] })
    .injectEndpoints({
        endpoints: (builder) => ({
            getMyMood: builder.query<MyMood, void>({
                query: () => "/moods/me", // hits /api/moods/me
                // If your backend returns null, normalize it to a consistent object:
                transformResponse: (res: any): MyMood =>
                    res ?? { userId: -1, mood: null },
                providesTags: ["Mood"],
            }),

            setMyMood: builder.mutation<MyMood, { mood: MoodKey }>({
                query: ({ mood }) => ({
                    url: "/moods/me",
                    method: "PUT", // match your Flask route
                    body: { mood },
                }),
                async onQueryStarted({ mood }, { dispatch, queryFulfilled }) {
                    const patch = dispatch(
                        moodApi.util.updateQueryData("getMyMood", undefined, (draft) => {
                            if (draft) {
                                draft.mood = mood as MoodKey;
                            }
                        })
                    );
                    try { await queryFulfilled; } catch { patch.undo(); }
                },
                invalidatesTags: ["Mood"]
            }),

            clearMyMood: builder.mutation<{ ok: true }, void>({
                query: () => ({
                    url: "/moods/me", // /api/moods/me
                    method: "DELETE",
                }),
                invalidatesTags: ["Mood"],
            }),
        }),
    });

export const {
    useGetMyMoodQuery,
    useSetMyMoodMutation,
    useClearMyMoodMutation,
} = moodApi;
