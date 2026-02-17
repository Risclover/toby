import { apiSlice } from "./apiSlice";

export type FeaturedListRotation = "manual" | "auto_rotate" | "most_due_soon";
export type FeaturedTaskSortOrder = "due_date" | "priority" | "manual" | "assignee";
export type FeaturedListView = "detailed" | "compact";

interface FeaturedTasklistUrgencyFilter {
    overdue: boolean;
    dueToday: boolean;
    dueSoon: boolean;
}

export interface FeaturedTasklistSettings {
    featuredTasklistId: number | null;
    rotation: FeaturedListRotation;
    justMeFilter: boolean;
    urgencyFilter: FeaturedTasklistUrgencyFilter;
    importantOnly: boolean;
    maxItems: number;
    showCompleted: boolean;
    sortOrder: FeaturedTaskSortOrder;
    view: FeaturedListView | string;
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

        updateUserSettings: builder.mutation<FeaturedTasklistSettings, Partial<FeaturedTasklistSettings>>({
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