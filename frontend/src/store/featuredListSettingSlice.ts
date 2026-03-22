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
    tasklistId: number | null | undefined;
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

export interface FeaturedListSettings {
    id: number;
    userId: number;
    featuredTasklist: FeaturedTasklistSettings;
}

export const featuredListSettingsSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getFeaturedListSettings: builder.query<FeaturedListSettings, void>({
            query: () => "/featured-list-settings",
            providesTags: ["FeaturedListSettings"]
        }),

        updateFeaturedListSettings: builder.mutation<FeaturedTasklistSettings, Partial<FeaturedTasklistSettings>>({
            query: (data) => ({
                url: "/featured-list-settings",
                method: "PUT",
                body: { featuredTasklist: data }
            }),
            invalidatesTags: ["FeaturedListSettings"]
        }),

        resetFeaturedListSettings: builder.mutation<FeaturedListSettings, void>({
            query: () => ({
                url: "/featured-list-settings/reset",
                method: "POST"
            }),
            invalidatesTags: ["FeaturedListSettings"]
        }),

        featureTasklist: builder.mutation<void, { tasklistId: number; householdId: number }>({
            query: ({ tasklistId }) => ({
                url: `/featured-list-settings/featured-tasklist`,
                method: 'PATCH',
                body: { tasklistId },
            }),
            invalidatesTags: ['FeaturedListSettings', 'Household'], // Invalidate Household to ensure lists sync up eventually
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
                    featuredListSettingsSlice.util.updateQueryData('getFeaturedListSettings', undefined, (draft) => {
                        const currentId = draft.featuredTasklist.tasklistId;

                        // Backend Toggle Logic: 
                        // If the ID matches what's saved, set to null (toggle off).
                        // Otherwise, set to the new ID.
                        if (currentId === tasklistId) {
                            draft.featuredTasklist.tasklistId = null;
                        } else {
                            draft.featuredTasklist.tasklistId = tasklistId;
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
    useGetFeaturedListSettingsQuery,
    useUpdateFeaturedListSettingsMutation,
    useResetFeaturedListSettingsMutation,
    useFeatureTasklistMutation
} = featuredListSettingsSlice;