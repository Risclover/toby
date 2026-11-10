import { apiSlice } from "./apiSlice";

// Adjust to whatever Notification.to_dict() actually returns for "actor".
export interface NotificationActor {
    id: number;
    firstName: string;
    lastName: string;
    profileImg: string | null;
}

export interface NotificationItem {
    id: number;
    recipientId: number;
    householdId: number;
    actor: NotificationActor | null;
    type: string;
    entityType: string;
    entityId: number | null;
    entityLabel: string | null;
    entityLabels: string[];
    eventMetadata: Record<string, unknown> | null;
    count: number;
    createdAt: string;
    readAt: string | null;
}

export interface NotificationPage {
    items: NotificationItem[];
    nextCursor: string | null;
}

type NotificationTag = { type: "Notification"; id: "LIST" | "COUNT" };

const LIST_TAG: NotificationTag = { type: "Notification", id: "LIST" };
const COUNT_TAG: NotificationTag = { type: "Notification", id: "COUNT" };

export const notificationSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getNotifications: builder.query<NotificationPage, { cursor?: string; limit?: number } | void>({
            query: (args) => ({
                url: "/notifications",
                params: args ?? undefined,
            }),
            providesTags: [LIST_TAG],
        }),

        getUnseenCount: builder.query<{ count: number }, void>({
            query: () => "/notifications/unseen-count",
            providesTags: [COUNT_TAG],
        }),

        markNotificationsSeen: builder.mutation<{ lastSeenAt: string }, void>({
            query: () => ({ url: "/notifications/seen", method: "POST" }),
            invalidatesTags: [COUNT_TAG],
        }),

        markNotificationRead: builder.mutation<NotificationItem, number>({
            query: (id) => ({ url: `/notifications/${id}/read`, method: "POST" }),
            invalidatesTags: [LIST_TAG, COUNT_TAG],
        }),

        markNotificationUnread: builder.mutation<NotificationItem, number>({
            query: (id) => ({ url: `/notifications/${id}/unread`, method: "POST" }),
            invalidatesTags: [LIST_TAG, COUNT_TAG],
        }),

        markAllNotificationsRead: builder.mutation<{ updated: number }, void>({
            query: () => ({ url: "/notifications/read-all", method: "POST" }),
            invalidatesTags: [LIST_TAG, COUNT_TAG],
        }),
    }),
});

export const {
    useGetNotificationsQuery,
    useGetUnseenCountQuery,
    useMarkNotificationsSeenMutation,
    useMarkNotificationReadMutation,
    useMarkNotificationUnreadMutation,
    useMarkAllNotificationsReadMutation,
} = notificationSlice;