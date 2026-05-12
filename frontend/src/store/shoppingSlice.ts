import { apiSlice } from "./apiSlice";

export type ShoppingItem = {
    id: number;
    listId: number;
    creatorId: number;
    categoryId: number | null;
    category: string | null;
    name: string;
    quantity: number | null;
    unit: string | null;
    isChecked: boolean;
    notes: string | null;
    completedById: number | null;
    createdAt: string;
    updatedAt: string;
};

export type ShoppingListArchiver = {
    id: number;
    profileImg: string | null;
    firstName: string;
    lastName: string;
};

export type ShoppingCategory = {
    id: number;
    name: string;
    color: string;
    listId: number;
    createdAt: string;
    updatedAt: string;
};

export type ShoppingList = {
    id: number;
    name: string;
    householdId: number;
    creatorId: number;
    allMembers: boolean;
    isArchived: boolean;
    archivedBy: ShoppingListArchiver | null;
    categories: ShoppingCategory[];
    items: ShoppingItem[];
    memberIds: number[];
    createdAt: string;
    updatedAt: string;
};

export const shoppingSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({

        /* -------------------- Lists -------------------- */

        getShoppingLists: builder.query<ShoppingList[], number>({
            query: (householdId) => ({ url: "/shopping-lists", method: "GET", params: { householdId } }),
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ id }) => ({ type: "ShoppingList" as const, id })),
                        { type: "ShoppingList" as const, id: "LIST" },
                    ]
                    : [{ type: "ShoppingList" as const, id: "LIST" }],
        }),

        getShoppingList: builder.query<ShoppingList, number>({
            query: (id) => ({ url: `/shopping-lists/${id}`, method: "GET" }),
            providesTags: (_res, _err, id) => [{ type: "ShoppingList", id }],
        }),

        createShoppingList: builder.mutation<ShoppingList, { name: string; householdId: number }>({
            query: (body) => ({ url: "/shopping-lists", method: "POST", body }),
            invalidatesTags: (_r, _e, { householdId }) => [
                { type: "ShoppingList", id: "LIST" },
                { type: "Activity" as const, id: `HOUSEHOLD_${householdId}` },
            ],
        }),

        editShoppingList: builder.mutation<ShoppingList, { listId: number; name: string; householdId: number }>({
            query: ({ listId, name }) => ({ url: `/shopping-lists/${listId}`, method: "PATCH", body: { name } }),
            invalidatesTags: (_r, _e, { listId, householdId }) => [
                { type: "ShoppingList", id: listId },
                { type: "Activity" as const, id: `HOUSEHOLD_${householdId}` },
            ],
        }),

        deleteShoppingList: builder.mutation<{ message: string }, { listId: number; householdId: number }>({
            query: ({ listId }) => ({ url: `/shopping-lists/${listId}`, method: "DELETE" }),
            invalidatesTags: (_r, _e, { listId, householdId }) => [
                { type: "ShoppingList", id: listId },
                { type: "ShoppingList", id: "LIST" },
                { type: "Activity" as const, id: `HOUSEHOLD_${householdId}` },
            ],
        }),

        archiveShoppingList: builder.mutation<ShoppingList, { listId: number; householdId: number }>({
            query: ({ listId }) => ({ url: `/shopping-lists/${listId}/archive`, method: "PATCH" }),
            invalidatesTags: (_r, _e, { listId, householdId }) => [
                { type: "ShoppingList", id: listId },
                { type: "Activity" as const, id: `HOUSEHOLD_${householdId}` },
            ],
        }),

        unarchiveShoppingList: builder.mutation<ShoppingList, { listId: number; householdId: number }>({
            query: ({ listId }) => ({ url: `/shopping-lists/${listId}/unarchive`, method: "PATCH" }),
            invalidatesTags: (_r, _e, { listId, householdId }) => [
                { type: "ShoppingList", id: listId },
                { type: "Activity" as const, id: `HOUSEHOLD_${householdId}` },
            ],
        }),

        duplicateShoppingList: builder.mutation<ShoppingList, { listId: number; householdId: number }>({
            query: ({ listId }) => ({ url: `/shopping-lists/${listId}/duplicate`, method: "POST" }),
            invalidatesTags: (_r, _e, { householdId }) => [
                { type: "ShoppingList", id: "LIST" },
                { type: "Activity" as const, id: `HOUSEHOLD_${householdId}` },
            ],
        }),

        checkAllItems: builder.mutation<ShoppingList, { listId: number }>({
            query: ({ listId }) => ({ url: `/shopping-lists/${listId}/check-all`, method: "PATCH" }),
            invalidatesTags: (_r, _e, { listId }) => [{ type: "ShoppingList", id: listId }],
        }),

        uncheckAllItems: builder.mutation<ShoppingList, { listId: number }>({
            query: ({ listId }) => ({ url: `/shopping-lists/${listId}/uncheck-all`, method: "PATCH" }),
            invalidatesTags: (_r, _e, { listId }) => [{ type: "ShoppingList", id: listId }],
        }),

        clearList: builder.mutation<{ message: string }, { listId: number }>({
            query: ({ listId }) => ({ url: `/shopping-lists/${listId}/items`, method: "DELETE" }),
            invalidatesTags: (_r, _e, { listId }) => [{ type: "ShoppingList", id: listId }],
        }),

        manageAssignedMembers: builder.mutation<ShoppingList, { listId: number; members: number[] }>({
            query: ({ listId, members }) => ({
                url: `/shopping-lists/${listId}/assigned-members`,
                method: "PATCH",
                body: { members },
            }),
            invalidatesTags: (_r, _e, { listId }) => [{ type: "ShoppingList", id: listId }],
        }),

        /* -------------------- Items -------------------- */

        addShoppingItem: builder.mutation<ShoppingItem, { listId: number; name: string; categoryId?: number | null; quantity?: number | null; unit?: string | null; householdId: number }>({
            query: ({ listId, name, categoryId = null, quantity = null, unit = null }) => ({
                url: `/shopping-lists/${listId}/items`,
                method: "POST",
                body: { name, categoryId, quantity, unit },
            }),
            async onQueryStarted({ listId, name, categoryId = null, quantity = null, unit = null }, { dispatch, queryFulfilled }) {
                const tempId = Math.floor(Math.random() * -1e9);
                const patch = dispatch(
                    shoppingSlice.util.updateQueryData("getShoppingList", listId, (draft) => {
                        draft.items.push({
                            id: tempId,
                            listId,
                            name,
                            quantity,
                            unit,
                            isChecked: false,
                            categoryId,
                            category: null,
                            notes: null,
                            completedById: null,
                            creatorId: 0,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                        });
                    })
                );
                try {
                    const { data: created } = await queryFulfilled;
                    dispatch(
                        shoppingSlice.util.updateQueryData("getShoppingList", listId, (draft) => {
                            const idx = draft.items.findIndex((i) => i.id === tempId);
                            if (idx !== -1) draft.items[idx] = created;
                        })
                    );
                } catch {
                    patch.undo();
                }
            },
            invalidatesTags: (_r, _e, { listId, householdId }) => [
                { type: "ShoppingList", id: listId },
                { type: "Activity" as const, id: `HOUSEHOLD_${householdId}` },
            ],
        }),

        editShoppingItem: builder.mutation<ShoppingItem, { itemId: number; listId: number; name?: string; quantity?: number | null; unit?: string | null; notes?: string | null; categoryId?: number | null }>({
            query: ({ itemId, ...fields }) => ({
                url: `/shopping-items/${itemId}`,
                method: "PATCH",
                body: fields,
            }),
            async onQueryStarted({ itemId, listId, ...fields }, { dispatch, queryFulfilled }) {
                const patch = dispatch(
                    shoppingSlice.util.updateQueryData("getShoppingList", listId, (draft) => {
                        const item = draft.items.find((i) => i.id === itemId);
                        if (item) Object.assign(item, fields);
                    })
                );
                try {
                    const { data: updated } = await queryFulfilled;
                    dispatch(
                        shoppingSlice.util.updateQueryData("getShoppingList", listId, (draft) => {
                            const idx = draft.items.findIndex((i) => i.id === itemId);
                            if (idx !== -1) draft.items[idx] = updated;
                        })
                    );
                } catch {
                    patch.undo();
                }
            },
            invalidatesTags: (_r, _e, { listId }) => [{ type: "ShoppingList", id: listId }],
        }),

        toggleShoppingItem: builder.mutation<ShoppingItem, { itemId: number; listId: number; householdId: number }>({
            query: ({ itemId }) => ({ url: `/shopping-items/${itemId}/toggle`, method: "PATCH" }),
            async onQueryStarted({ itemId, listId }, { dispatch, queryFulfilled }) {
                const patch = dispatch(
                    shoppingSlice.util.updateQueryData("getShoppingList", listId, (draft) => {
                        const item = draft.items.find((i) => i.id === itemId);
                        if (item) item.isChecked = !item.isChecked;
                    })
                );
                try {
                    const { data: updated } = await queryFulfilled;
                    dispatch(
                        shoppingSlice.util.updateQueryData("getShoppingList", listId, (draft) => {
                            const idx = draft.items.findIndex((i) => i.id === itemId);
                            if (idx !== -1) draft.items[idx] = updated;
                        })
                    );
                } catch {
                    patch.undo();
                }
            },
            invalidatesTags: (_r, _e, { listId, householdId }) => [
                { type: "ShoppingList", id: listId },
                { type: "Activity" as const, id: `HOUSEHOLD_${householdId}` },
            ],
        }),

        deleteShoppingItem: builder.mutation<{ message: string }, { itemId: number; listId: number; householdId: number }>({
            query: ({ itemId }) => ({ url: `/shopping-items/${itemId}`, method: "DELETE" }),
            async onQueryStarted({ itemId, listId }, { dispatch, queryFulfilled }) {
                const patch = dispatch(
                    shoppingSlice.util.updateQueryData("getShoppingList", listId, (draft) => {
                        const idx = draft.items.findIndex((i) => i.id === itemId);
                        if (idx !== -1) draft.items.splice(idx, 1);
                    })
                );
                try {
                    await queryFulfilled;
                } catch {
                    patch.undo();
                }
            },
            invalidatesTags: (_r, _e, { listId, householdId }) => [
                { type: "ShoppingList", id: listId },
                { type: "Activity" as const, id: `HOUSEHOLD_${householdId}` },
            ],
        }),

        /* -------------------- Categories -------------------- */

        getShoppingListCategories: builder.query<ShoppingCategory[], number>({
            query: (listId) => ({ url: "/shopping-categories", method: "GET", params: { listId } }),
            providesTags: (_res, _err, listId) => [{ type: "ShoppingCategory", id: `LIST_${listId}` }],
        }),

        createShoppingCategory: builder.mutation<ShoppingCategory, { name: string; color: string; listId: number }>({
            query: (body) => ({ url: "/shopping-categories", method: "POST", body }),
            invalidatesTags: (_r, _e, { listId }) => [
                { type: "ShoppingCategory", id: `LIST_${listId}` },
                { type: "ShoppingList", id: listId },
            ],
        }),

        editShoppingCategory: builder.mutation<ShoppingCategory, { id: number; listId: number; name?: string; color?: string }>({
            query: ({ id, name, color }) => ({ url: `/shopping-categories/${id}`, method: "PATCH", body: { name, color } }),
            invalidatesTags: (_r, _e, { listId }) => [
                { type: "ShoppingCategory", id: `LIST_${listId}` },
                { type: "ShoppingList", id: listId },
            ],
        }),

        deleteShoppingCategory: builder.mutation<{ message: string }, { id: number; listId: number }>({
            query: ({ id }) => ({ url: `/shopping-categories/${id}`, method: "DELETE" }),
            invalidatesTags: (_r, _e, { listId }) => [
                { type: "ShoppingCategory", id: `LIST_${listId}` },
                { type: "ShoppingList", id: listId },
            ],
        }),
    }),
});

export const {
    // lists
    useGetShoppingListsQuery,
    useGetShoppingListQuery,
    useCreateShoppingListMutation,
    useEditShoppingListMutation,
    useDeleteShoppingListMutation,
    useArchiveShoppingListMutation,
    useUnarchiveShoppingListMutation,
    useDuplicateShoppingListMutation,
    useCheckAllItemsMutation,
    useUncheckAllItemsMutation,
    useClearListMutation,
    useManageAssignedMembersMutation,
    // items
    useAddShoppingItemMutation,
    useEditShoppingItemMutation,
    useToggleShoppingItemMutation,
    useDeleteShoppingItemMutation,
    // categories
    useGetShoppingListCategoriesQuery,
    useCreateShoppingCategoryMutation,
    useEditShoppingCategoryMutation,
    useDeleteShoppingCategoryMutation,
} = shoppingSlice;