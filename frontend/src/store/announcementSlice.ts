// src/store/announcementSlice.ts
import { apiSlice } from "./apiSlice";

export type Announcement = {
    id: number;
    userId: number;
    householdId: number;
    text: string;
    isPinned?: boolean;
    createdAt?: string | null;
    updatedAt?: string | null;
    publishedAt?: string | null;
    expiresAt?: string | null;
};

export type CreateAnnouncementRequest = {
    householdId: number;
    text: string;
    isPinned?: boolean;
    publishedAt?: string | null; // ISO string or null
    expiresAt?: string | null;   // ISO string or null
};

export type UpdateAnnouncementRequest = {
    id: number;
    text?: string;
    isPinned?: boolean;
    publishedAt?: string | null;
    expiresAt?: string | null;
};

type AnnouncementTag = { type: "Announcement"; id: number | "LIST" };

export const announcementApi = apiSlice.enhanceEndpoints({ addTagTypes: ["Announcement"] }).injectEndpoints({
    endpoints: (builder) => ({
        // GET /announcements/:id
        getAnnouncements: builder.query<Announcement[], { householdId: number }>({
            query: ({ householdId }) => ({
                url: "/announcements",
                params: { householdId },
            }),
            providesTags: (result) =>
                result
                    ? [
                        ...result.map((a) => ({ type: "Announcement" as const, id: a.id })),
                        { type: "Announcement", id: "LIST" },
                    ]
                    : [{ type: "Announcement", id: "LIST" }],
        }),
        getAnnouncement: builder.query<Announcement, number>({
            query: (id) => `/announcements/${id}`,
            providesTags: (result, _err, id): AnnouncementTag[] =>
                result ? [{ type: "Announcement", id }] : [],
        }),

        // POST /announcements/
        createAnnouncement: builder.mutation<Announcement, CreateAnnouncementRequest>({
            query: (body) => ({
                url: `/announcements/`,
                method: "POST",
                body,
            }),
            invalidatesTags: (_res): AnnouncementTag[] => [
                // If you later add a list endpoint, this will trigger it to refetch.
                { type: "Announcement", id: "LIST" },
            ],
        }),

        // PATCH /announcements/:id
        updateAnnouncement: builder.mutation<Announcement, UpdateAnnouncementRequest>({
            query: ({ id, ...patch }) => ({
                url: `/announcements/${id}`,
                method: "PATCH",
                body: patch,
            }),
            invalidatesTags: (res): AnnouncementTag[] =>
                res
                    ? [
                        { type: "Announcement", id: res.id },
                        { type: "Announcement", id: "LIST" },
                    ]
                    : [{ type: "Announcement", id: "LIST" }],
        }),

        // DELETE /announcements/:id
        deleteAnnouncement: builder.mutation<void, number>({
            query: (id) => ({
                url: `/announcements/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: (_res, _err, id): AnnouncementTag[] => [
                { type: "Announcement", id },
                { type: "Announcement", id: "LIST" },
            ],
        }),

        // If/when you add GET /announcements?householdId=123, uncomment this:
        // listAnnouncements: builder.query<Announcement[], { householdId: number; active?: boolean; pinnedOnly?: boolean; limit?: number; offset?: number }>({
        //   query: ({ householdId, active = true, pinnedOnly = false, limit = 20, offset = 0 }) =>
        //     `/announcements?householdId=${householdId}&active=${active ? 1 : 0}&pinnedOnly=${pinnedOnly ? 1 : 0}&limit=${limit}&offset=${offset}`,
        //   providesTags: (result): AnnouncementTag[] =>
        //     result
        //       ? [
        //           ...result.map((a) => ({ type: "Announcement" as const, id: a.id })),
        //           { type: "Announcement", id: "LIST" },
        //         ]
        //       : [{ type: "Announcement", id: "LIST" }],
        // }),
    }),
    overrideExisting: false,
});

export const {
    useGetAnnouncementsQuery,
    useGetAnnouncementQuery,
    useCreateAnnouncementMutation,
    useUpdateAnnouncementMutation,
    useDeleteAnnouncementMutation,
    // useListAnnouncementsQuery, // when you add the GET collection route
} = announcementApi;
