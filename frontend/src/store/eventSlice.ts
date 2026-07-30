import { apiSlice } from "./apiSlice";

/** ---------- Types ---------- */

export type EventAttendee = {
    id: number;
    first_name: string | null;
    color: string;
};

export type EventVisibility = 'public' | 'private';

export type CalendarEvent = {
    id: number;
    householdId: number;
    creatorId: number;
    title: string;
    startUtc: string;
    endUtc: string;
    tzid: string;
    hasTime: boolean;
    rrule: string | null;
    visibility: EventVisibility;
    allMembers: boolean;
    createdAt: string;
    attendees: EventAttendee[];
    attendeeIds: number[];
    displayColor: string;
    household: {
        id: number;
        adminId: number;
    };
};

/** ---------- Creation inputs ---------- */

type TimedEventInput = {
    title: string;
    tzid?: string;
    startUtc: string; // ISO
    endUtc: string;
    rrule?: string;
    visibility?: EventVisibility;
    allMembers?: boolean;
    attendeeIds?: number[];
};
type DateOnlyEventInput = {
    title: string;
    tzid?: string;
    date: string;
    rrule?: string;
    visibility?: EventVisibility;
    allMembers?: boolean;
    attendeeIds?: number[];
};
export type CreateEventInput = { householdId: number } & (TimedEventInput | DateOnlyEventInput);

/** ---------- Update inputs (PATCH-style, id + householdId required) ---------- */

type UpdateEventBase = {
    id: number;
    householdId: number;
};

type UpdateEventPayload = UpdateEventBase &
    Partial<{
        title: string;
        tzid: string;
        startUtc: string;
        endUtc: string;
        date: string;
        rrule: string;
        visibility: EventVisibility;
        allMembers: boolean;
        attendeeIds: number[];
    }>;

type GetRangeArgs = {
    householdId: number;
    startIso: string;
    endIso: string;
    attendeeIds?: number[];
};
type AllArgs = { householdId: number };

/** Small helper: strip undefined so we only send changed fields */
const clean = <T extends Record<string, any>>(obj: T) =>
    Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

function patchAllRangeCaches(
    dispatch: (action: any) => { undo: () => void },
    getState: any,
    householdId: number,
    updater: (draft: CalendarEvent[]) => void
) {
    const cachedArgs = eventSlice.util.selectCachedArgsForQuery(getState(), "getHouseholdEvents");
    const patches: { undo: () => void }[] = [];
    for (const args of cachedArgs) {
        if (args.householdId !== householdId) continue;
        patches.push(dispatch(eventSlice.util.updateQueryData("getHouseholdEvents", args, updater)));
    }
    return patches;
}

export const eventSlice = apiSlice.injectEndpoints({
    endpoints: (b) => ({
        getHouseholdEvents: b.query<CalendarEvent[], GetRangeArgs>({
            query: ({ householdId, startIso, endIso, attendeeIds }) => {
                const params = new URLSearchParams({ start: startIso, end: endIso });
                if (attendeeIds && attendeeIds.length > 0) {
                    params.set("attendeeIds", attendeeIds.join(","));
                }
                return `/events/households/${householdId}/events?${params.toString()}`;
            },
            providesTags: (_res, _err, a) => [
                {
                    type: "Calendar",
                    id: `RANGE_${a.householdId}|${a.startIso}|${a.endIso}|${(a.attendeeIds ?? []).join(",")}`,
                },
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

        updateEvent: b.mutation<CalendarEvent, UpdateEventPayload>({
            query: ({ id, householdId, ...patch }) => ({
                url: `/events/households/${householdId}/events/${id}`,
                method: "PATCH",
                body: clean(patch),
            }),
            async onQueryStarted({ id, householdId, ...patch }, { dispatch, getState, queryFulfilled }) {
                const applyPatch = (draft: CalendarEvent[]) => {
                    const idx = draft.findIndex((e) => e.id === id);
                    if (idx !== -1) {
                        Object.assign(draft[idx], patch);
                    }
                };

                const patches = [
                    dispatch(
                        eventSlice.util.updateQueryData("getAllHouseholdEvents", { householdId }, applyPatch)
                    ),
                    ...patchAllRangeCaches(dispatch, getState, householdId, applyPatch),
                ];

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
            async onQueryStarted({ id, householdId }, { dispatch, getState, queryFulfilled }) {
                const applyDelete = (draft: CalendarEvent[]) => {
                    const idx = draft.findIndex((e) => e.id === id);
                    if (idx !== -1) draft.splice(idx, 1);
                };

                const patches = [
                    dispatch(
                        eventSlice.util.updateQueryData("getAllHouseholdEvents", { householdId }, applyDelete)
                    ),
                    ...patchAllRangeCaches(dispatch, getState, householdId, applyDelete),
                ];

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

        unassignSelf: b.mutation<CalendarEvent, { id: number; householdId: number }>({
            query: ({ id, householdId }) => ({
                url: `/events/households/${householdId}/events/${id}/unassign`,
                method: "POST",
            }),
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
    useUnassignSelfMutation,
} = eventSlice;