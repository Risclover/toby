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

    // Automatic reminder metadata
    sourceEntityId?: number | null;
    sourceEntityType?: string | null;

    triggerAt?: string | null;
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
                        ...result.map(({ id }) => ({ type: 'Reminders' as const, id })),
                        { type: 'Reminders', id: 'LIST' },
                    ]
                    : [{ type: 'Reminders', id: 'LIST' }],
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
                        ...result.map(({ id }) => ({ type: 'Reminders' as const, id })),
                        { type: 'Reminders', id: 'LIST' },
                    ]
                    : [{ type: 'Reminders', id: 'LIST' }],
        }),

        /**
         * Create a MANUAL reminder only
         */
        createManualReminder: builder.mutation<
            Reminder,
            { householdId: number; title?: string; body: string; triggerAt?: string; assignedToIds?: number[] }
        >({
            query: ({ householdId, ...body }) => ({
                url: `/households/${householdId}/reminders`,
                method: 'POST',
                body,
            }),
            invalidatesTags: [{ type: 'Reminders', id: 'LIST' }],
        }),

        /**
         * Mark reminder as seen (user-specific)
         */
        markReminderSeen: builder.mutation<void, number>({
            query: (id) => ({
                url: `/reminders/${id}/seen`,
                method: 'PATCH',
            }),
            invalidatesTags: (result, error, id) => [{ type: 'Reminders', id }],
        }),

        /**
         * Update MANUAL reminder only
         */
        updateManualReminder: builder.mutation<
            Reminder,
            {
                id: number;
                title?: string;
                reminderBody?: string;
                triggerAt?: string | null;
                assignedToIds?: number[];
            }
        >({
            query: ({ id, ...body }) => ({
                url: `/reminders/${id}`,
                method: 'PATCH',
                body,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'Reminders', id }],
        }),

        /**
         * Delete MANUAL reminder only
         */
        deleteManualReminder: builder.mutation<{ message: string }, number>({
            query: (id) => ({
                url: `/reminders/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: [{ type: 'Reminders', id: 'LIST' }],
        }),
    }),
});

export const {
    useGetUserRemindersQuery,
    useGetHouseholdRemindersQuery,
    useCreateManualReminderMutation,
    useMarkReminderSeenMutation,
    useUpdateManualReminderMutation,
    useDeleteManualReminderMutation,
} = reminderSlice;