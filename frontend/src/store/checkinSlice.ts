// src/store/checkinSlice.ts
import { apiSlice } from "./apiSlice";

type CheckinsResponse = {
    userId: number;
    from: string;
    to: string;
    dates: string[];
};

type CheckInTodayResponse = { checkedInToday: boolean; localDate: string };

export const checkinApi = apiSlice.injectEndpoints({
    endpoints: (b) => ({
        getUserCheckins: b.query<CheckinsResponse, { userId: number; from?: string; to?: string }>({
            query: ({ userId, from, to }) => {
                const p = new URLSearchParams();
                if (from) p.set("from", from);
                if (to) p.set("to", to);
                return `/users/${userId}/checkins${p.toString() ? `?${p.toString()}` : ""}`;
            },
            providesTags: (_res, _err, { userId }) => [{ type: "Checkin", id: `USER_${userId}` }],
        }),

        checkInToday: b.mutation<CheckInTodayResponse, { userId: number; householdId?: number }>({
            query: ({ userId }) => ({
                url: `/users/${userId}/checkins`,
                method: "POST",
            }),
            invalidatesTags: (_res, _err, { userId, householdId }) => [
                { type: "Checkin", id: `USER_${userId}` },
                ...(householdId != null ? [{ type: "Activity" as const, id: `HOUSEHOLD_${householdId}` }] : []),
            ],
        }),
    }),
});

export const {
    useGetUserCheckinsQuery,
    useCheckInTodayMutation,
} = checkinApi;
