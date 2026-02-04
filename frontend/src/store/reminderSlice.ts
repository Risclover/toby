import { apiSlice } from './apiSlice';

export type Reminder = {
    id: number;
    householdId: number;
    createdById?: number | null;
    assignedToId?: number | null;
    body: string;
    reminderType: "custom" | "task_due" | "event_starting" | "daily_check_in_missing";
    isAutomatic: boolean;
    sourceEntityId?: number | null;
    sourceEntityType?: string | null;
    seen: boolean;
    dueAt?: string | null;
    triggerAt?: string | null;
    expiresAt?: string | null;
    createdAt: string;
    updatedAt: string;
    createdBy?: {
        id: number;
        firstName: string;
        profileImg?: string | null;
    } | null;
};

export const reminderSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        // GET reminders for a household
        getUserReminders: builder.query({
            query: (userId) => `/users/${userId}/reminders`,
            providesTags: (result = [], error, arg) =>
                result
                    ? [...result.map(({ id }) => ({ type: 'Reminders', id })), { type: 'Reminders', id: 'LIST' }]
                    : [{ type: 'Reminders', id: 'LIST' }],
        }),

        // Fetch all reminders for a household
        getHouseholdReminders: builder.query({
            query: (householdId) => `/households/${householdId}/reminders`,
            providesTags: (result = [], error, arg) =>
                result
                    ? [...result.map(({ id }) => ({ type: 'Reminders', id })), { type: 'Reminders', id: 'LIST' }]
                    : [{ type: 'Reminders', id: 'LIST' }],
        }),

        // Create manual reminder
        createManualReminder: builder.mutation({
            query: ({ householdId, ...body }) => ({
                url: `/households/${householdId}/reminders`,
                method: 'POST',
                body,
            }),
            invalidatesTags: [{ type: 'Reminders', id: 'LIST' }],
        }),

        // Mark reminder as seen
        markReminderSeen: builder.mutation({
            query: (id) => ({
                url: `/reminders/${id}/seen`,
                method: 'PATCH',
            }),
            invalidatesTags: (result, error, id) => [{ type: 'Reminders', id }],
        }),

        // Update manual reminder
        updateManualReminder: builder.mutation({
            query: ({ id, ...body }) => ({
                url: `/reminders/${id}`,
                method: 'PATCH',
                body,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'Reminders', id }],
        }),

        // Delete manual reminder
        deleteManualReminder: builder.mutation({
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