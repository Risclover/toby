// src/store/eventSlice.ts
import { apiSlice } from "./apiSlice";

/** ---------- Types ---------- */
export type CalendarEvent = {
    id: number;
    householdId: number;
    title: string;
    startUtc?: string | null; // may be null for floating/instant
    endUtc?: string | null;   // may be null for instant
    tzid: string;
    hasTime: boolean;
    createdAt: string;
};

/** Creation inputs */
type TimedEventInput = {
    title: string;
    tzid?: string;
    startUtc: string;        // ISO
    endUtc?: string | null;  // OPTIONAL for start-only timed events
};
type DateOnlyEventInput = {
    title: string;
    tzid?: string;
    date: string;            // YYYY-MM-DD (all-day)
};
type FloatingEventInput = {
    title: string;
    tzid?: string;
    // no time/date fields
};
type CreateEventInput = { householdId: number } &
    (TimedEventInput | DateOnlyEventInput | FloatingEventInput);

/** Update inputs (PATCH-style, id + householdId required) */
type UpdateEventBase = {
    id: number;
    householdId: number;
};
// You can send any subset of these:
type UpdateEventPayload = UpdateEventBase & Partial<{
    title: string;
    tzid: string;
    startUtc: string | null;        // if present without endUtc, it's a start-only timed update
    endUtc: string | null;   // explicitly null if you want to “clear” end (instant)
    date: string;            // all-day switch/update (YYYY-MM-DD)
    hasTime: boolean;
}>;

type GetRangeArgs = { householdId: number; startIso: string; endIso: string };
type AllArgs = { householdId: number };

/** Small helper: strip undefined so we only send changed fields */
const clean = <T extends Record<string, any>>(obj: T) =>
    Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

export const eventSlice = apiSlice.injectEndpoints({
    endpoints: (b) => ({
        getHouseholdEvents: b.query<CalendarEvent[], GetRangeArgs>({
            query: ({ householdId, startIso, endIso }) =>
                `/events/households/${householdId}/events?start=${encodeURIComponent(startIso)}&end=${encodeURIComponent(endIso)}`,
            providesTags: (_res, _err, a) => [
                { type: "Calendar", id: `RANGE_${a.householdId}|${a.startIso}|${a.endIso}` },
                { type: "Calendar", id: `HOUSEHOLD_${a.householdId}` },
            ],
        }),

        getAllHouseholdEvents: b.query<CalendarEvent[], AllArgs>({
            query: ({ householdId }) => `/events/households/${householdId}/events?all=1`,
            keepUnusedDataFor: 3600,
            providesTags: (_r, _e, a) => [{ type: "Calendar", id: `HOUSEHOLD_${a.householdId}_ALL` }],
        }),

        createEvent: b.mutation<CalendarEvent, CreateEventInput>({
            query: ({ householdId, ...body }) => ({
                url: `/events/households/${householdId}/events`,
                method: "POST",
                body: clean(body),
            }),
            invalidatesTags: (_res, _err, body) => [
                { type: "Calendar", id: `HOUSEHOLD_${body.householdId}` },
                { type: "Calendar", id: `HOUSEHOLD_${body.householdId}_ALL` },
            ],
        }),

        /** ---------- New: updateEvent (PATCH) ---------- */
        updateEvent: b.mutation<CalendarEvent, UpdateEventPayload>({
            query: ({ id, householdId, ...patch }) => ({
                url: `/events/households/${householdId}/events/${id}`,
                method: "PATCH",
                body: clean(patch),
            }),
            // Optimistic update: merge changed fields into caches that likely contain the event
            async onQueryStarted({ id, householdId, ...patch }, { dispatch, queryFulfilled }) {
                const patches: { undo: () => void }[] = [];
                patches.push(
                    dispatch(
                        eventSlice.util.updateQueryData("getAllHouseholdEvents", { householdId }, (draft) => {
                            const idx = draft.findIndex((e) => e.id === id);
                            if (idx !== -1) {
                                draft[idx] = { ...draft[idx], ...patch } as CalendarEvent;
                            }
                        })
                    )
                );
                try {
                    await queryFulfilled;
                } catch {
                    patches.forEach((p) => p.undo());
                }
            },
            invalidatesTags: (_res, _err, { householdId }) => [
                { type: "Calendar", id: `HOUSEHOLD_${householdId}` },
                { type: "Calendar", id: `HOUSEHOLD_${householdId}_ALL` },
            ],
        }),

        deleteEvent: b.mutation<void, { id: number; householdId: number }>({
            query: ({ id, householdId }) => ({
                url: `/events/households/${householdId}/events/${id}`,
                method: "DELETE",
            }),
            async onQueryStarted({ id, householdId }, { dispatch, queryFulfilled }) {
                const patch = dispatch(
                    eventSlice.util.updateQueryData("getAllHouseholdEvents", { householdId }, (draft) => {
                        const idx = draft.findIndex((e) => e.id === id);
                        if (idx !== -1) draft.splice(idx, 1);
                    })
                );
                try { await queryFulfilled; } catch { patch.undo(); }
            },
            invalidatesTags: (_res, _err, { householdId }) => [
                { type: "Calendar", id: `HOUSEHOLD_${householdId}` },
                { type: "Calendar", id: `HOUSEHOLD_${householdId}_ALL` },
            ],
        }),
    }),
    overrideExisting: false,
});

// Hooks
export const {
    useGetHouseholdEventsQuery,
    useGetAllHouseholdEventsQuery,
    useCreateEventMutation,
    useUpdateEventMutation,
    useDeleteEventMutation,
} = eventSlice;
