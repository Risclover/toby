import { apiSlice } from "./apiSlice";
import { householdSlice } from "./householdSlice";

export type FeaturedListRotation = "manual" | "auto_rotate" | "most_due_soon";
export type FeaturedTaskSortOrder = "manual" | "due_date" | "alphabetical" | "newest" | "oldest" | "importance";
export type FeaturedListView = "detailed" | "compact";

interface FeaturedTasklistUrgencyFilter {
    overdue: boolean;
    dueToday: boolean;
    dueSoon: boolean;
}

export interface FeaturedTasklistSettings {
    featuredTasklistId: number | null | undefined;
    rotation: boolean;
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
                body: { featuredTasklist: data }
            }),
            invalidatesTags: ["UserSettings"]
        }),

        resetUserSettings: builder.mutation<UserSettings, void>({
            query: () => ({
                url: "/user-settings/reset",
                method: "POST"
            }),
            invalidatesTags: ["UserSettings"]
        }),

        featureTasklist: builder.mutation<void, { tasklistId: number; householdId: number }>({
            query: ({ tasklistId }) => ({
                url: `/user-settings/featured-tasklist`,
                method: 'PATCH',
                body: { tasklistId },
            }),
            invalidatesTags: ['UserSettings', 'Household'], // Invalidate Household to ensure lists sync up eventually
            async onQueryStarted({ householdId, tasklistId }, { dispatch, queryFulfilled }) {
                // 1. Update the Lists (Visual "Star" icon on the dashboard cards)
                const listPatch = dispatch(
                    householdSlice.util.updateQueryData('getHouseholdTasklists', householdId, (draft) => {
                        // We need to determine if we are toggling ON or OFF.
                        // We assume that if the target list is currently featured, we are turning it off.
                        // Otherwise, we are turning it on (and turning others off).

                        // Find if the target is currently featured
                        const targetList = draft.find((l: any) => l.id === tasklistId);
                        const isCurrentlyFeatured = targetList?.isFeatured;

                        draft.forEach((list: any) => {
                            if (list.id === tasklistId) {
                                // Toggle logic
                                list.isFeatured = !isCurrentlyFeatured;
                            } else {
                                // If we are turning ON the target, we must turn OFF everyone else.
                                // If we are turning OFF the target, everyone else stays off.
                                if (!isCurrentlyFeatured) {
                                    list.isFeatured = false;
                                }
                            }
                        });
                    })
                );

                // 2. Update User Settings (The new home for the ID)
                const settingsPatch = dispatch(
                    userSettingsSlice.util.updateQueryData('getUserSettings', undefined, (draft) => {
                        const currentId = draft.featuredTasklist.featuredTasklistId;

                        // Backend Toggle Logic: 
                        // If the ID matches what's saved, set to null (toggle off).
                        // Otherwise, set to the new ID.
                        if (currentId === tasklistId) {
                            draft.featuredTasklist.featuredTasklistId = null;
                        } else {
                            draft.featuredTasklist.featuredTasklistId = tasklistId;
                        }
                    })
                );

                try {
                    await queryFulfilled;
                } catch {
                    listPatch.undo();
                    settingsPatch.undo();
                }
            },
        })
    })
})

export const {
    useGetUserSettingsQuery,
    useUpdateUserSettingsMutation,
    useResetUserSettingsMutation,
    useFeatureTasklistMutation
} = userSettingsSlice;