// src/store/calendarSlice.ts
import { apiSlice } from "./apiSlice";

export type CalendarEvent = {
    id: number;
    householdId: number;
    title: string;
    startUtc: string; // ISO
    endUtc: string;   // ISO
    tzid: string;
    createdAt: string;
};

export const calendarApi = apiSlice.enhanceEndpoints({ addTagTypes: ["Calendar"] }).injectEndpoints({
    endpoints: (b) => ({
        // GET /api/households/:hid/events?start=...&end=...
        getHouseholdEvents: b.query<CalendarEvent[], { householdId: number; startIso: string; endIso: string }>({
            query: ({ householdId, startIso, endIso }) =>
                `/events/households/${householdId}/events?start=${encodeURIComponent(
                    startIso
                )}&end=${encodeURIComponent(endIso)}`,
            providesTags: (_res, _err, a) => [
                // exact range tag (useful later if you want precision)
                { type: "Calendar", id: `RANGE_${a.householdId}|${a.startIso}|${a.endIso}` },
                // broad household tag so creates can invalidate all visible ranges at once
                { type: "Calendar", id: `HOUSEHOLD_${a.householdId}` },
            ],
        }),

        // POST /api/households/:hid/events
        createEvent: b.mutation<CalendarEvent, { householdId: number; title: string; startUtc: string; endUtc: string; tzid: string }>({
            query: ({ householdId, ...body }) => ({
                url: `/events/households/${householdId}/events`,
                method: "POST",
                body,
            }),
            // simplest: broadly invalidate by household so active queries refetch
            invalidatesTags: (_res, _err, body) => [
                { type: "Calendar", id: `HOUSEHOLD_${body.householdId}` },
            ],
        }),
    }),
});

export const { useGetHouseholdEventsQuery, useCreateEventMutation } = calendarApi;
