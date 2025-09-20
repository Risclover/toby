// src/store/checkinSlice.ts
import { apiSlice } from "./apiSlice";

type CheckinsResponse = {
    userId: number;
    from: string;
    to: string;
    dates: string[];
};

type CheckInTodayResponse = { checkedInToday: boolean; localDate: string };

export const checkinApi = apiSlice.enhanceEndpoints({ addTagTypes: ["Checkins"] }).injectEndpoints({
    endpoints: (b) => ({
        getUserCheckins: b.query<CheckinsResponse, { userId: number; from?: string; to?: string }>({
            query: ({ userId, from, to }) => {
                const p = new URLSearchParams();
                if (from) p.set("from", from);
                if (to) p.set("to", to);
                return `/users/${userId}/checkins${p.toString() ? `?${p.toString()}` : ""}`;
            },
            providesTags: (_res, _err, { userId }) => [{ type: "Checkins", id: `USER_${userId}` }],
        }),

        checkInToday: b.mutation<CheckInTodayResponse, { userId: number }>({
            query: ({ userId }) => ({
                url: `/users/${userId}/checkins`,
                method: "POST",
            }),
            invalidatesTags: (_res, _err, { userId }) => [{ type: "Checkins", id: `USER_${userId}` }],
        }),
    }),
});

export const {
    useGetUserCheckinsQuery,
    useCheckInTodayMutation,
} = checkinApi;
