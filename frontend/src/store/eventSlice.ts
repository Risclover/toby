import { apiSlice } from "./apiSlice";

export type CalendarEvent = {
    id: number;
    householdId: number;
    title: string;
    // backend may return null/undefined when floating
    startUtc?: string | null;
    endUtc?: string | null;
    tzid: string;
    hasTime: boolean;          // <-- add this if you added it in the DB/model
    createdAt: string;
};

// Inputs for creation (discriminated union)
type TimedEventInput = {
    title: string;
    tzid?: string;
    startUtc: string; // ISO
    endUtc: string;   // ISO
};

type DateOnlyEventInput = {
    title: string;
    tzid?: string;
    date: string;     // "YYYY-MM-DD"
};

type FloatingEventInput = {
    title: string;
    tzid?: string;
    // no time/date fields
};

type CreateEventInput =
    { householdId: number } & (TimedEventInput | DateOnlyEventInput | FloatingEventInput);

export const eventSlice = apiSlice
    .enhanceEndpoints({ addTagTypes: ["Calendar"] })
    .injectEndpoints({
        endpoints: (b) => ({
            // GET /api/households/:hid/events?start=...&end=...
            getHouseholdEvents: b.query<
                CalendarEvent[],
                { householdId: number; startIso: string; endIso: string }
            >({
                query: ({ householdId, startIso, endIso }) =>
                    `/events/households/${householdId}/events?start=${encodeURIComponent(
                        startIso
                    )}&end=${encodeURIComponent(endIso)}`,
                providesTags: (_res, _err, a) => [
                    { type: "Calendar", id: `RANGE_${a.householdId}|${a.startIso}|${a.endIso}` },
                    { type: "Calendar", id: `HOUSEHOLD_${a.householdId}` },
                ],
            }),

            // POST /api/households/:hid/events
            createEvent: b.mutation<CalendarEvent, CreateEventInput>({
                query: ({ householdId, ...body }) => {
                    // Strip out any undefined fields so we only send what the user provided.
                    const cleanBody = Object.fromEntries(
                        Object.entries(body).filter(([, v]) => v !== undefined)
                    );
                    return {
                        url: `/events/households/${householdId}/events`,
                        method: "POST",
                        body: cleanBody,
                    };
                },
                invalidatesTags: (_res, _err, body) => [
                    { type: "Calendar", id: `HOUSEHOLD_${body.householdId}` },
                ],
            }),
        }),
    });

export const { useGetHouseholdEventsQuery, useCreateEventMutation } = eventSlice;
