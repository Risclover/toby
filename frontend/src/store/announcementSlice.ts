import { apiSlice } from "./apiSlice";

export type Announcement = {
    id: number;
    userId: number;
    householdId: number;
    message: string;
    isImportant: boolean;
    createdAt?: string | null;
    seenByCurrent?: boolean; // Add this to track seen status
    creator: {
        id: number;
        name: string;
        profileImg: string;
    }
}

export type AnnouncementSeenResponse = {
    announcementId: number;
    seenByCurrent: boolean;
    seenAt: string | null;
}

export type AnnouncementsResponse = {
    items: Announcement[];
    nextCursor: string | null;
    hasNextPage: boolean;
};

export const announcementApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        // GET all announcements for a household
        getAnnouncements: builder.query<
            AnnouncementsResponse,
            {
                householdId: number;
                limit?: number;
                cursor?: string | null;
                sort?: "newest" | "oldest" | "important";
                importantOnly?: boolean;
                creatorId?: number;
                seen?: "seen" | "unseen";
            }
        >({
            query: ({
                householdId,
                limit = 10,
                cursor,
                sort = "newest",
                importantOnly,
                creatorId,
                seen
            }) => ({
                url: `/households/${householdId}/announcements`,
                params: {
                    limit,
                    cursor,
                    sort,
                    important_only: importantOnly,
                    creator_id: creatorId,
                    seen
                }
            }),

            serializeQueryArgs: ({ endpointName, queryArgs }) => {
                const { cursor, ...rest } = queryArgs;
                return `${endpointName}-${JSON.stringify(rest)}`;
            },

            merge: (currentCache, newData) => {
                currentCache.items.push(...newData.items);
                currentCache.nextCursor = newData.nextCursor;
                currentCache.hasNextPage = newData.hasNextPage;
            },

            forceRefetch({ currentArg, previousArg }) {
                return currentArg?.cursor !== previousArg?.cursor;
            },

            providesTags: (_res, _err, { householdId }) => [
                { type: "Announcement", id: `HOUSEHOLD_${householdId}` }
            ]
        }),

        createAnnouncement: builder.mutation<Announcement, { householdId: number; message: string; isImportant: boolean }>({
            query: ({ householdId, message, isImportant }) => ({
                url: `/announcements`,
                method: "POST",
                body: { householdId, message, isImportant },
            }),
            invalidatesTags: (_res, _err, { householdId }) => [
                { type: "Announcement", id: `HOUSEHOLD_${householdId}` },
            ],
        }),

        updateAnnouncementIsImportant: builder.mutation<Announcement, { announcementId: number; isImportant: boolean }>({
            query: ({ announcementId, isImportant }) => ({
                url: `/announcements/${announcementId}`,
                method: "PUT",
                body: { isImportant },
            }),
            invalidatesTags: (res) =>
                res ? [{ type: "Announcement", id: res.id }] : [],
        }),

        deleteAnnouncement: builder.mutation<void, { announcementId: number; householdId: number }>({
            query: ({ announcementId }) => ({
                url: `/announcements/${announcementId}`,
                method: "DELETE",
            }),
            invalidatesTags: (_res, _err, { householdId }) => [
                { type: "Announcement", id: `HOUSEHOLD_${householdId}` },
            ],
        }),

        markAnnouncementSeen: builder.mutation<AnnouncementSeenResponse, { announcementId: number; householdId: number }>({
            query: ({ announcementId }) => ({
                url: `/announcements/${announcementId}/seen`,
                method: "POST",
            }),
            invalidatesTags: (_res, _err, { announcementId, householdId }) => [
                { type: "Announcement", id: announcementId },
                { type: "Announcement", id: `HOUSEHOLD_${householdId}` },
            ],
        }),

        markAnnouncementUnseen: builder.mutation<void, { announcementId: number; householdId: number }>({
            query: ({ announcementId }) => ({
                url: `/announcements/${announcementId}/seen`,
                method: "DELETE",
            }),
            invalidatesTags: (_res, _err, { announcementId, householdId }) => [
                { type: "Announcement", id: announcementId },
                { type: "Announcement", id: `HOUSEHOLD_${householdId}` },
            ],
        }),

        checkAnnouncementSeen: builder.query<AnnouncementSeenResponse, { announcementId: number }>({
            query: ({ announcementId }) => `/announcements/${announcementId}/seen`,
            providesTags: (_result, _error, { announcementId }) => [
                { type: "Announcement", id: announcementId },
            ],
        }),

        markAnnouncementsSeenBulk: builder.mutation<{ marked: number }, { householdId: number; announcementIds: number[] }>({
            query: ({ announcementIds }) => ({
                url: `/announcements/seen`,
                method: "POST",
                body: { announcementIds },
            }),
            invalidatesTags: (_res, _err, { householdId, announcementIds }) => {
                const tags: Array<{ type: "Announcement"; id: number | string }> = [
                    { type: "Announcement", id: `HOUSEHOLD_${householdId}` },
                ];
                announcementIds.forEach((id) => tags.push({ type: "Announcement", id }));
                return tags;
            },
        }),

        toggleAnnouncementImportance: builder.mutation<Announcement, { announcementId: number; isImportant: boolean; householdId: number }>({
            query: ({ announcementId, isImportant }) => ({
                url: `/announcements/${announcementId}/importance`,
                method: "PUT",
                body: { isImportant },
            }),
            invalidatesTags: (_res, _err, { announcementId, householdId }) => [
                { type: "Announcement", id: announcementId },
                { type: "Announcement", id: `HOUSEHOLD_${householdId}` },
            ],
        })
    })
})

export const {
    useGetAnnouncementsQuery,
    useCreateAnnouncementMutation,
    useUpdateAnnouncementIsImportantMutation,
    useDeleteAnnouncementMutation,
    useMarkAnnouncementSeenMutation,
    useMarkAnnouncementUnseenMutation,
    useCheckAnnouncementSeenQuery, // Changed from Mutation to Query
    useMarkAnnouncementsSeenBulkMutation,
    useToggleAnnouncementImportanceMutation
} = announcementApi;