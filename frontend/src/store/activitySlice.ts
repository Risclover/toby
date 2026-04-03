import { apiSlice } from "./apiSlice";

export type ActivityActor = {
    id: number;
    displayName: string;
    profileImg: string | undefined;
};

export type ActivityEvent = {
    id: number;
    householdId: number;
    actor: ActivityActor;
    action: string;
    entityType: string;
    entityId: number | null;
    entityLabel: string | null;
    eventMetadata: Record<string, any> | null;
    createdAt: string;
};

export type ActivityResponse = {
    items: ActivityEvent[];
    nextCursor: string | null;
};

export type GetActivityArgs = {
    householdId: number;
    actorId?: number;   // ← new
    limit?: number;
    cursor?: string;
};

export const activitySlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getActivity: builder.query<ActivityResponse, GetActivityArgs>({
            query: ({ householdId, actorId, limit = 20, cursor }) => {
                const params = new URLSearchParams();
                params.set("limit", String(limit));
                if (cursor) params.set("cursor", cursor);
                if (actorId) params.set("actor_id", String(actorId));  // ← new
                return `/activity/${householdId}?${params.toString()}`;
            },
            providesTags: (_result, _err, { householdId, actorId }) => [
                {
                    type: "Activity",
                    id: actorId ? `USER_${actorId}` : `HOUSEHOLD_${householdId}`,  // ← new
                },
            ],
        }),
    }),
});

export const { useGetActivityQuery } = activitySlice;