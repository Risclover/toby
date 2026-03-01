import { apiSlice } from "./apiSlice";

export type AnnouncementSeenResponse = {
    announcementId: number;
    seenByCurrent: boolean;
    seenAt: string | null;
};

export type Announcement = {
    id: number;
    userId: number;
    householdId: number;
    message: string;
    isImportant: boolean;
    createdAt?: string | null;
    seenByCurrent?: boolean;
    creator: { id: number; firstName: string; profileImg: string };
};

export type AnnouncementsResponse = {
    items: Announcement[];
    page: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    totalCount: number;
};

export const announcementApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        // GET all announcements for a household
        getAnnouncements: builder.query<
            AnnouncementsResponse,
            {
                householdId: number;
                limit?: number;
                page?: number;
                search?: string;
                sort?: string;
                importance?: "all" | "important";
                creatorId?: number;
                time?: "today" | "7days" | "30days" | "all";
            }
        >({
            query: ({ householdId, limit = 10, page = 1, search, sort, importance, creatorId, time }) => ({
                url: `/households/${householdId}/announcements`,
                params: {
                    limit,
                    page,
                    search,
                    sort,
                    important: importance === "important" ? "true" : undefined,
                    creator_id: creatorId ?? undefined,
                    time: time === "all" ? undefined : time,
                },
            }),
            serializeQueryArgs: ({ endpointName, queryArgs }) => {
                const {
                    householdId,
                    page = 1,
                    limit = 10,
                    search = "",
                    sort = "",
                    importance = "all",
                    creatorId,
                    time = "all",
                } = queryArgs;
                return `${endpointName}-household${householdId}-page${page}-limit${limit}-search${search}-sort${sort}-importance${importance}-creator${creatorId ?? ""}-time${time}`;
            },
            providesTags: (result, _error, { householdId }) => {
                if (!result || !Array.isArray(result.items)) {
                    return [{ type: "Announcement" as const, id: `HOUSEHOLD_${householdId}` }];
                }
                return [
                    ...result.items.map(({ id }) => ({ type: "Announcement" as const, id })),
                    { type: "Announcement" as const, id: `HOUSEHOLD_${householdId}` },
                ];
            },
        }),

        createAnnouncement: builder.mutation<
            Announcement,
            { householdId: number; message: string; isImportant: boolean }
        >({
            query: ({ householdId, message, isImportant }) => ({
                url: `/announcements`,
                method: "POST",
                body: { householdId, message, isImportant },
            }),
            invalidatesTags: (_res, _err, { householdId }) => [
                { type: "Announcement", id: `HOUSEHOLD_${householdId}` },
            ],
        }),

        updateAnnouncementIsImportant: builder.mutation<
            Announcement,
            { announcementId: number; isImportant: boolean }
        >({
            query: ({ announcementId, isImportant }) => ({
                url: `/announcements/${announcementId}`,
                method: "PUT",
                body: { isImportant },
            }),
            invalidatesTags: (res) =>
                res ? [{ type: "Announcement", id: res.id }] : [],
        }),

        deleteAnnouncement: builder.mutation<
            void,
            { announcementId: number; householdId: number }
        >({
            query: ({ announcementId }) => ({
                url: `/announcements/${announcementId}`,
                method: "DELETE",
            }),
            invalidatesTags: (_res, _err, { householdId }) => [
                { type: "Announcement", id: `HOUSEHOLD_${householdId}` },
            ],
        }),

        markAnnouncementSeen: builder.mutation<
            AnnouncementSeenResponse,
            { announcementId: number; householdId: number }
        >({
            query: ({ announcementId }) => ({
                url: `/announcements/${announcementId}/seen`,
                method: "POST",
            }),
            invalidatesTags: (_res, _err, { announcementId, householdId }) => [
                { type: "Announcement", id: announcementId },
                { type: "Announcement", id: `HOUSEHOLD_${householdId}` },
            ],
        }),

        markAnnouncementUnseen: builder.mutation<
            void,
            { announcementId: number; householdId: number }
        >({
            query: ({ announcementId }) => ({
                url: `/announcements/${announcementId}/seen`,
                method: "DELETE",
            }),
            invalidatesTags: (_res, _err, { announcementId, householdId }) => [
                { type: "Announcement", id: announcementId },
                { type: "Announcement", id: `HOUSEHOLD_${householdId}` },
            ],
        }),

        checkAnnouncementSeen: builder.query<
            AnnouncementSeenResponse,
            { announcementId: number }
        >({
            query: ({ announcementId }) => `/announcements/${announcementId}/seen`,
            providesTags: (_result, _error, { announcementId }) => [
                { type: "Announcement", id: announcementId },
            ],
        }),

        // BULK SEEN: do NOT invalidate tags so the UI doesn't refetch immediately
        markAnnouncementsSeenBulk: builder.mutation<
            { marked: number },
            { householdId: number; announcementIds: number[] }
        >({
            query: ({ announcementIds }) => ({
                url: `/announcements/seen`,
                method: "POST",
                body: { announcementIds },
            }),
        }),

        toggleAnnouncementImportance: builder.mutation<
            Announcement,
            { announcementId: number; isImportant: boolean; householdId: number }
        >({
            query: ({ announcementId, isImportant }) => ({
                url: `/announcements/${announcementId}/importance`,
                method: "PUT",
                body: { isImportant },
            }),
            invalidatesTags: (_res, _err, { announcementId, householdId }) => [
                { type: "Announcement", id: announcementId },
                { type: "Announcement", id: `HOUSEHOLD_${householdId}` },
            ],
        }),
    }),
});

export const {
    useGetAnnouncementsQuery,
    useCreateAnnouncementMutation,
    useUpdateAnnouncementIsImportantMutation,
    useDeleteAnnouncementMutation,
    useMarkAnnouncementSeenMutation,
    useMarkAnnouncementUnseenMutation,
    useCheckAnnouncementSeenQuery,
    useMarkAnnouncementsSeenBulkMutation,
    useToggleAnnouncementImportanceMutation,
} = announcementApi;
