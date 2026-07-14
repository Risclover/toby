import { apiSlice } from "./apiSlice";
import { householdSlice } from "./householdSlice";

export type FeaturedShoppingListSortOrder = "alpha" | "created";
export type FeaturedShoppingListView = "detailed" | "compact";

export interface FeaturedShoppingListSettings {
    listId: number | null | undefined;
    maxItems: number;
    showCompleted: boolean;
    sortOrder: FeaturedShoppingListSortOrder;
    categoryGroups: boolean;
    showProgress: boolean;
    showQuickAdd: boolean;
    view: FeaturedShoppingListView;
}

export interface FeaturedShoppingListSettingsResponse {
    id: number;
    userId: number;
    featuredList: FeaturedShoppingListSettings;
}

export const featuredShoppingListSettingsSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getFeaturedShoppingListSettings: builder.query<FeaturedShoppingListSettingsResponse, void>({
            query: () => "/featured-shopping-list-settings",
            providesTags: ["FeaturedShoppingListSettings"]
        }),

        updateFeaturedShoppingListSettings: builder.mutation<FeaturedShoppingListSettings, Partial<FeaturedShoppingListSettings>>({
            query: (data) => ({
                url: "/featured-shopping-list-settings",
                method: "PUT",
                body: { featuredShoppingList: data }
            }),
            invalidatesTags: ["FeaturedShoppingListSettings"]
        }),

        resetFeaturedShoppingListSettings: builder.mutation<FeaturedShoppingListSettingsResponse, void>({
            query: () => ({
                url: "/featured-shopping-list-settings/reset",
                method: "POST"
            }),
            invalidatesTags: ["FeaturedShoppingListSettings"]
        }),

        featureShoppingList: builder.mutation<void, { listId: number; householdId: number }>({
            query: ({ listId }) => ({
                url: `/featured-shopping-list-settings/featured-shopping-list`,
                method: "PATCH",
                body: { listId },
            }),
            invalidatesTags: ["FeaturedShoppingListSettings", "Household"],
            async onQueryStarted({ householdId, listId }, { dispatch, queryFulfilled }) {
                // 1. Update the household shopping lists cache (star icon on the list cards)
                // NOTE: assumes an endpoint named 'getHouseholdShoppingLists' exists on householdSlice,
                // mirroring 'getHouseholdTasklists'. Rename if yours differs.
                const listPatch = dispatch(
                    householdSlice.util.updateQueryData('getHouseholdShoppingLists', householdId, (draft) => {
                        const targetList = draft.find((l: any) => l.id === listId);
                        const isCurrentlyFeatured = targetList?.isFeatured;

                        draft.forEach((list: any) => {
                            if (list.id === listId) {
                                list.isFeatured = !isCurrentlyFeatured;
                            } else if (!isCurrentlyFeatured) {
                                list.isFeatured = false;
                            }
                        });
                    })
                );

                // 2. Update the settings cache optimistically
                const settingsPatch = dispatch(
                    featuredShoppingListSettingsSlice.util.updateQueryData('getFeaturedShoppingListSettings', undefined, (draft) => {
                        const currentId = draft.featuredList.listId;
                        draft.featuredList.listId = currentId === listId ? null : listId;
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
    useGetFeaturedShoppingListSettingsQuery,
    useUpdateFeaturedShoppingListSettingsMutation,
    useResetFeaturedShoppingListSettingsMutation,
    useFeatureShoppingListMutation
} = featuredShoppingListSettingsSlice;