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
    limit?: number;
    cursor?: string;
};

export const activitySlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getActivity: builder.query<ActivityResponse, GetActivityArgs>({
            query: ({ householdId, limit = 20, cursor }) => {
                const params = new URLSearchParams();
                params.set("limit", String(limit));
                if (cursor) params.set("cursor", cursor);
                return `/activity/${householdId}?${params.toString()}`;
            },
            providesTags: (_result, _err, { householdId }) => [
                { type: "Activity", id: `HOUSEHOLD_${householdId}` },
            ],
        }),
    }),
});

export const { useGetActivityQuery } = activitySlice;