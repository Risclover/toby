import { apiSlice } from './apiSlice';
import type { User } from './authSlice';

/**
 * Reminder as returned from:
 * - GET /users/:id/reminders
 * - GET /households/:id/reminders
 */
export type Reminder = {
    id: number;
    householdId: number;

    createdById?: number | null;
    createdBy?: {
        id: number;
        firstName: string;
        profileImg?: string | null;
    } | null;

    message: string;

    reminderType: "custom" | "task_due" | "event_starting" | "daily_check_in_missing";
    isAutomatic: boolean;
    repeatFrequency: "daily" | "weekly" | "monthly" | null;

    // Automatic reminder metadata
    sourceEntityId?: number | null;
    sourceEntityType?: string | null;
    sourceEntityMetadata?: Record<string, any> | null; // <-- new field for flexible metadata from backend

    triggerDate?: string | undefined;
    deliveredAt?: string | null;
    isActive: boolean;

    createdAt: string;
    updatedAt: string;

    // Who this reminder is assigned to (household view)
    assignedTo?: User[];

    // User-specific view (user reminders endpoint)
    currentUserAssignment?: {
        seen: boolean;
    };
};

export type PaginatedReminders = {
    items: Reminder[];
    page: number;
    hasNextPage: boolean;
    totalCount: number;
};

export const reminderSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({

        /**
         * Get reminders visible to a specific user
         * (triggered, active, not seen by THIS user)
         */
        getUserReminders: builder.query<Reminder[], number>({
            query: (userId) => `/users/${userId}/reminders`,
            providesTags: (result = []) =>
                result.length
                    ? [
                        ...result.map(({ id }) => ({ type: 'Reminder' as const, id })),
                        { type: 'Reminder', id: 'LIST' },
                    ]
                    : [{ type: 'Reminder', id: 'LIST' }],
        }),

        getAllUserReminders: builder.query<PaginatedReminders, { userId: number; page?: number; limit?: number }>({
            query: ({ userId, page = 1, limit = 20 }) =>
                `/users/${userId}/reminders/all?page=${page}&limit=${limit}`,
            providesTags: (result) =>
                result
                    ? [
                        ...result.items.map(({ id }) => ({ type: 'Reminder' as const, id })),
                        { type: 'Reminder', id: 'LIST' },
                    ]
                    : [{ type: 'Reminder', id: 'LIST' }],
        }),

        getUserCreatedReminders: builder.query<PaginatedReminders, { userId: number; page?: number; limit?: number }>({
            query: ({ userId, page = 1, limit = 20 }) =>
                `/users/${userId}/reminders/created?page=${page}&limit=${limit}`,
            providesTags: (result) =>
                result
                    ? [
                        ...result.items.map(({ id }) => ({ type: 'Reminder' as const, id })),
                        { type: 'Reminder', id: 'LIST' },
                    ]
                    : [{ type: 'Reminder', id: 'LIST' }],
        }),

        /**
         * Get all reminders for a household
         * (includes automatic + manual)
         */
        getHouseholdReminders: builder.query<Reminder[], number>({
            query: (householdId) => `/households/${householdId}/reminders`,
            providesTags: (result = []) =>
                result.length
                    ? [
                        ...result.map(({ id }) => ({ type: 'Reminder' as const, id })),
                        { type: 'Reminder', id: 'LIST' },
                    ]
                    : [{ type: 'Reminder', id: 'LIST' }],
        }),

        /**
         * Create a MANUAL reminder only
         */
        createManualReminder: builder.mutation<
            Reminder,
            {
                householdId: number; message: string; triggerDate?: Date | null; assignedToIds?: number[]; seen: boolean; repeat: "daily" | "weekly" | "monthly" | null; sourceEntityId: number | null; sourceEntityType: string | null;
            }
        >({
            query: ({ householdId, ...body }) => ({
                url: `/households/${householdId}/reminders`,
                method: 'POST',
                body,
            }),
            invalidatesTags: [{ type: 'Reminder', id: 'LIST' }],
        }),

        /**
         * Mark reminder as seen (user-specific)
         */
        markReminderSeen: builder.mutation<void, number>({
            query: (id) => ({
                url: `/reminders/${id}/seen`,
                method: 'PATCH',
            }),
            invalidatesTags: (result, error, id) => [{ type: 'Reminder', id }],
        }),

        /**
         * Update MANUAL reminder only
         */
        updateManualReminder: builder.mutation<
            Reminder,
            {
                id: number;
                reminderBody?: string;
                triggerDate?: string | null;
                assignedToIds?: number[];
            }
        >({
            query: ({ id, ...body }) => ({
                url: `/reminders/${id}`,
                method: 'PATCH',
                body,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'Reminder', id }],
        }),

        /**
         * Delete MANUAL reminder only
         */
        deleteManualReminder: builder.mutation<{ message: string }, number>({
            query: (id) => ({
                url: `/reminders/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: [{ type: 'Reminder', id: 'LIST' }],
        }),
        getUserRemindersPreview: builder.query<Reminder[], number>({
            query: (householdId) => `/households/${householdId}/reminders/preview`,
            providesTags: (result = []) =>
                result.length
                    ? [
                        ...result.map(({ id }) => ({ type: 'Reminder' as const, id })),
                        { type: 'Reminder', id: 'LIST' },
                    ]
                    : [{ type: 'Reminder', id: 'LIST' }],
        }),

        markReminderSeenBulk: builder.mutation<{ marked: number }, { reminderIds: number[] }>({
            query: (body) => ({
                url: `/reminders/seen/bulk`,
                method: 'POST',
                body,
            }),
            invalidatesTags: [{ type: 'Reminder', id: 'LIST' }],
        }),
    }),
});

export const {
    useGetUserRemindersQuery,
    useGetAllUserRemindersQuery,
    useGetUserCreatedRemindersQuery,
    useGetHouseholdRemindersQuery,
    useCreateManualReminderMutation,
    useMarkReminderSeenMutation,
    useUpdateManualReminderMutation,
    useDeleteManualReminderMutation,
    useGetUserRemindersPreviewQuery,
    useMarkReminderSeenBulkMutation,
} = reminderSlice;