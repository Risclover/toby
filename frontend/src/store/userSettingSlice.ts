import { apiSlice } from "./apiSlice";

export type FeaturedListRotation = "manual" | "auto_rotate" | "most_due_soon";
export type TaskAssigneeFilter = "just_me" | "all_tasks";
export type TaskUrgencyFilter = "all" | "overdue_only" | "due_today" | "due_this_week";
export type FeaturedTaskSortOrder = "due_date" | "priority" | "manual" | "assignee";
export type FeaturedListView = "detailed" | "compact";

export interface FeaturedTasklistSettings {
    rotation: FeaturedListRotation;
    assigneeFilter: TaskAssigneeFilter;
    urgencyFilter: TaskUrgencyFilter;
    showStarredOnly: boolean;
    maxItems: number;
    showCompleted: boolean;
    sortOrder: FeaturedTaskSortOrder;
    view: FeaturedListView;
    showProgress: boolean;
    showQuickAdd: boolean;
}

export interface UserSettings {
    id: number;
    userId: number;
    featuredTasklist: FeaturedTasklistSettings;
}

export const userSettingsSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getUserSettings: builder.query<UserSettings, void>({
            query: () => "/user-settings",
            providesTags: ["UserSettings"]
        }),

        updateUserSettings: builder.mutation<UserSettings, Partial<UserSettings>>({
            query: (data) => ({
                url: "/user-settings",
                method: "PUT",
                body: data
            }),
            invalidatesTags: ["UserSettings"]
        }),

        resetUserSettings: builder.mutation<UserSettings, void>({
            query: () => ({
                url: "/user-settings/reset",
                method: "POST"
            }),
            invalidatesTags: ["UserSettings"]
        })
    })
})

export const {
    useGetUserSettingsQuery,
    useUpdateUserSettingsMutation,
    useResetUserSettingsMutation
} = userSettingsSlice;