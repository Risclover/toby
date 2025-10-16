// src/store/shoppingSlice.ts
import { apiSlice } from "./apiSlice";

/** Shared types you can expand as needed */
export type ShoppingItem = {
    id: number;
    shoppingListId: number;
    name: string;
    quantity: number;
    purchased: boolean;
    // Frontend helpers; backend sends category as string (or nested object if you choose)
    category?: string | null;
    categoryId: number;
    categoryName?: string | null;
    notes?: string | null;
};

export const shoppingSlice = apiSlice
    .enhanceEndpoints({ addTagTypes: ["ShoppingList", "ShoppingItem", "ShoppingCategory"] })
    .injectEndpoints({
        endpoints: (builder) => ({
            /* -------------------- Lists -------------------- */

            // NOTE: Your backend snippet doesn't show GET /shopping_lists
            // Keep this if you have that route elsewhere; otherwise remove it.
            getShoppingLists: builder.query<any, void>({
                query: () => ({ url: "/shopping_lists", method: "GET" }),
                providesTags: (result) =>
                    result
                        ? [
                            ...result.map(({ id }: { id: number }) => ({ type: "ShoppingList" as const, id })),
                            { type: "ShoppingList" as const, id: "LIST" },
                        ]
                        : [{ type: "ShoppingList" as const, id: "LIST" }],
            }),

            getShoppingList: builder.query<any, number>({
                query: (id) => ({ url: `/shopping_lists/${id}`, method: "GET" }),
                providesTags: (_res, _err, id) => [{ type: "ShoppingList", id }],
            }),

            createShoppingList: builder.mutation<any, { title: string; userId?: number; householdId?: number }>({
                query: (body) => ({ url: `/shopping_lists/`, method: "POST", body }),
                invalidatesTags: [{ type: "ShoppingList", id: "LIST" }],
            }),

            editShoppingList: builder.mutation<any, { listId: number; title: string }>({
                query: ({ listId, title }) => ({ url: `/shopping_lists/${listId}`, method: "PUT", body: { title } }),
                invalidatesTags: (_r, _e, { listId }) => [{ type: "ShoppingList", id: listId }],
            }),

            deleteShoppingList: builder.mutation<{ message: string }, { listId: number }>({
                query: ({ listId }) => ({ url: `/shopping_lists/${listId}`, method: "DELETE" }),
                invalidatesTags: (_r, _e, { listId }) => [
                    { type: "ShoppingList", id: listId },
                    { type: "ShoppingList", id: "LIST" },
                ],
            }),

            /* -------------------- Items -------------------- */

            getShoppingItems: builder.query<ShoppingItem[], number>({
                query: (listId) => `/shopping_lists/${listId}/items`,
                providesTags: (_res, _err, listId) => [{ type: "ShoppingItem", id: `LIST_${listId}` }],
            }),

            // Align to backend: POST expects { name, category (string|null), quantity, purchased }
            addShoppingItem: builder.mutation<
                ShoppingItem,
                { listId: number; name: string; category?: string | null; quantity?: number; purchased?: boolean }
            >({
                query: ({ listId, name, category = null, quantity = 1, purchased = false }) => ({
                    url: `/shopping_lists/${listId}/items`,
                    method: "POST",
                    body: { name, category, quantity, purchased },
                }),
                async onQueryStarted({ listId, name, category = null, quantity = 1 }, { dispatch, queryFulfilled }) {
                    const tempId = Math.floor(Math.random() * -1e9);
                    const patch = dispatch(
                        shoppingSlice.util.updateQueryData("getShoppingItems", listId, (draft) => {
                            draft.push({
                                id: tempId,
                                shoppingListId: listId,
                                name,
                                quantity,
                                purchased: false,
                                category,
                                categoryName: category ?? null,
                            });
                        })
                    );
                    try {
                        const { data: created } = await queryFulfilled;
                        dispatch(
                            shoppingSlice.util.updateQueryData("getShoppingItems", listId, (draft) => {
                                const idx = draft.findIndex((i) => i.id === tempId);
                                if (idx !== -1) draft[idx] = created as ShoppingItem;
                            })
                        );
                    } catch {
                        patch.undo();
                    }
                },
                invalidatesTags: (_r, _e, { listId }) => [{ type: "ShoppingItem", id: `LIST_${listId}` }],
            }),

            // Fetch a single item (useful after edits if you want to re-sync)
            getShoppingItem: builder.query<ShoppingItem, number>({
                query: (itemId) => `/shopping_items/${itemId}`,
                providesTags: (_r, _e, itemId) => [{ type: "ShoppingItem", id: itemId }],
            }),

            // Toggle purchased — backend flips value itself; send NO body.
            toggleShoppingItem: builder.mutation<ShoppingItem, { itemId: number; listId: number, purchased: boolean }>({
                query: ({ itemId }) => ({
                    url: `/shopping_items/${itemId}/toggle`,
                    method: "PUT",
                }),
                async onQueryStarted({ itemId, listId }, { dispatch, queryFulfilled }) {
                    const patch = dispatch(
                        shoppingSlice.util.updateQueryData("getShoppingItems", listId, (draft) => {
                            const it = draft.find((i) => i.id === itemId);
                            if (it) it.purchased = !it.purchased;
                        })
                    );
                    try {
                        await queryFulfilled;
                    } catch {
                        patch.undo();
                    }
                },
                invalidatesTags: (_r, _e, { listId }) => [{ type: "ShoppingItem", id: `LIST_${listId}` }],
            }),

            // Explicit “set purchased” via general PUT (hits /shopping_items/<id> with { purchased })
            setShoppingItemPurchased: builder.mutation<
                ShoppingItem,
                { itemId: number; listId: number; purchased: boolean }
            >({
                query: ({ itemId, purchased }) => ({
                    url: `/shopping_items/${itemId}`,
                    method: "PUT",
                    body: { purchased },
                }),
                async onQueryStarted({ itemId, listId, purchased }, { dispatch, queryFulfilled }) {
                    const patch = dispatch(
                        shoppingSlice.util.updateQueryData("getShoppingItems", listId, (draft) => {
                            const it = draft.find((i) => i.id === itemId);
                            if (it) it.purchased = purchased;
                        })
                    );
                    try {
                        await queryFulfilled;
                    } catch {
                        patch.undo();
                    }
                },
                invalidatesTags: (_r, _e, { listId }) => [{ type: "ShoppingItem", id: `LIST_${listId}` }],
            }),

            deleteShoppingItem: builder.mutation<{ message?: string }, { itemId: number; listId: number }>({
                query: ({ itemId }) => ({ url: `/shopping_items/${itemId}`, method: "DELETE" }),
                async onQueryStarted({ itemId, listId }, { dispatch, queryFulfilled }) {
                    const patch = dispatch(
                        shoppingSlice.util.updateQueryData("getShoppingItems", listId, (draft) => {
                            const idx = draft.findIndex((i) => i.id === itemId);
                            if (idx !== -1) draft.splice(idx, 1);
                        })
                    );
                    try {
                        await queryFulfilled;
                    } catch {
                        patch.undo();
                    }
                },
                invalidatesTags: (_r, _e, { listId }) => [{ type: "ShoppingItem", id: `LIST_${listId}` }],
            }),

            /* ---------- Field-specific item edits (match your routes) ---------- */

            editShoppingItemCategory: builder.mutation<
                ShoppingItem,
                { itemId: number; listId: number; category: string | null }
            >({
                query: ({ itemId, category }) => ({
                    url: `/shopping_items/${itemId}/category`,
                    method: "PUT",
                    body: { category }, // backend: string name in this list, or null to unset
                }),
                async onQueryStarted({ itemId, listId, category }, { dispatch, queryFulfilled }) {
                    const patch = dispatch(
                        shoppingSlice.util.updateQueryData("getShoppingItems", listId, (draft) => {
                            const it = draft.find((i) => i.id === itemId);
                            if (it) {
                                it.category = category;
                                it.categoryName = category;
                            }
                        })
                    );
                    try {
                        const { data: updated } = await queryFulfilled;
                        dispatch(
                            shoppingSlice.util.updateQueryData("getShoppingItems", listId, (draft) => {
                                const it = draft.find((i) => i.id === itemId);
                                if (it) Object.assign(it, updated);
                            })
                        );
                    } catch {
                        patch.undo();
                    }
                },
                invalidatesTags: (_r, _e, { listId }) => [{ type: "ShoppingItem", id: `LIST_${listId}` }],
            }),

            editShoppingItemQuantity: builder.mutation<ShoppingItem, { itemId: number; listId: number; quantity: number }>({
                query: ({ itemId, quantity }) => ({
                    url: `/shopping_items/${itemId}/quantity`,
                    method: "PUT",
                    body: { quantity },
                }),
                async onQueryStarted({ itemId, listId, quantity }, { dispatch, queryFulfilled }) {
                    const patch = dispatch(
                        shoppingSlice.util.updateQueryData("getShoppingItems", listId, (draft) => {
                            const it = draft.find((i) => i.id === itemId);
                            if (it) it.quantity = quantity;
                        })
                    );
                    try {
                        await queryFulfilled;
                    } catch {
                        patch.undo();
                    }
                },
                invalidatesTags: (_r, _e, { listId }) => [{ type: "ShoppingItem", id: `LIST_${listId}` }],
            }),

            editShoppingItemName: builder.mutation<ShoppingItem, { itemId: number; listId: number; name: string }>({
                query: ({ itemId, name }) => ({ url: `/shopping_items/${itemId}/name`, method: "PUT", body: { name } }),
                async onQueryStarted({ itemId, listId, name }, { dispatch, queryFulfilled }) {
                    const patch = dispatch(
                        shoppingSlice.util.updateQueryData("getShoppingItems", listId, (draft) => {
                            const it = draft.find((i) => i.id === itemId);
                            if (it) it.name = name;
                        })
                    );
                    try {
                        await queryFulfilled;
                    } catch {
                        patch.undo();
                    }
                },
                invalidatesTags: (_r, _e, { listId }) => [{ type: "ShoppingItem", id: `LIST_${listId}` }],
            }),

            editShoppingItemNotes: builder.mutation<ShoppingItem, { itemId: number; listId: number; notes: string | null }>({
                query: ({ itemId, notes }) => ({ url: `/shopping_items/${itemId}/notes`, method: "PUT", body: { notes } }),
                async onQueryStarted({ itemId, listId, notes }, { dispatch, queryFulfilled }) {
                    const patch = dispatch(
                        shoppingSlice.util.updateQueryData("getShoppingItems", listId, (draft) => {
                            const it = draft.find((i) => i.id === itemId);
                            if (it) it.notes = notes ?? null;
                        })
                    );
                    try {
                        await queryFulfilled;
                    } catch {
                        patch.undo();
                    }
                },
                invalidatesTags: (_r, _e, { listId }) => [{ type: "ShoppingItem", id: `LIST_${listId}` }],
            }),

            /* -------------------- Categories -------------------- */

            getShoppingListCategories: builder.query<any[], number>({
                query: (listId) => `/shopping_lists/${listId}/categories`,
                providesTags: (_res, _err, listId) => [{ type: "ShoppingCategory", id: `LIST_${listId}` }],
            }),

            getShoppingItemCategory: builder.query<any, number>({
                query: (itemId) => `/shopping_items/${itemId}/category`,
                providesTags: (_res, _err, itemId) => [{ type: "ShoppingCategory", id: `ITEM_${itemId}` }],
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
    // items
    useGetShoppingItemsQuery,
    useGetShoppingItemQuery,
    useAddShoppingItemMutation,
    useToggleShoppingItemMutation,
    useSetShoppingItemPurchasedMutation,
    useDeleteShoppingItemMutation,
    useEditShoppingItemCategoryMutation,
    useEditShoppingItemQuantityMutation,
    useEditShoppingItemNotesMutation,
    useEditShoppingItemNameMutation,
    // categories
    useGetShoppingItemCategoryQuery,
    useGetShoppingListCategoriesQuery,
} = shoppingSlice;
