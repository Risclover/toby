import { apiSlice } from "./apiSlice";

export type ShoppingItem = {
    id: number;
    shoppingListId: number;
    name: string;
    quantity: number;
    purchased: boolean;
    category: string;
    // add categoryId/categoryName if you return them
};

export const shoppingSlice = apiSlice.enhanceEndpoints({ addTagTypes: ["ShoppingList", "ShoppingItem", "ShoppingCategory"] }).injectEndpoints({
    endpoints: (builder) => ({
        getShoppingLists: builder.query<any, void>({
            query: () => ({
                url: "/shopping_lists",
                method: "GET"
            }),
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ id }: { id: number }) => ({ type: "ShoppingList" as const, id })),
                        { type: "ShoppingList", id: "LIST" },
                    ]
                    : [{ type: "ShoppingList", id: "LIST" }],
        }),
        getShoppingList: builder.query<any, number>({
            query: (id) => ({
                url: `/shopping_lists/${id}`,
                method: "GET"
            }),
            providesTags: (result, error, id) => [{ type: "ShoppingList", id }],
        }),

        getShoppingItems: builder.query<ShoppingItem[], number>({
            query: (listId) => `/shopping_lists/${listId}/items`,
            providesTags: (_result, _err, listId) => [
                { type: "ShoppingItem", id: `LIST_${listId}` },
            ],
        }),

        addShoppingItem: builder.mutation<
            ShoppingItem,
            { listId: number; name: string; category?: string; quantity?: number }
        >({
            query: ({ listId, name, category, quantity }) => ({
                url: `/shopping_lists/${listId}/items`,
                method: "POST",
                body: { name, category, quantity },
            }),
            async onQueryStarted({ listId, name, quantity }, { dispatch, queryFulfilled }) {
                // optimistic: push a temp item into the cache
                const patch = dispatch(
                    shoppingSlice.util.updateQueryData("getShoppingItems", listId, (draft) => {
                        draft.push({
                            id: Math.floor(Math.random() * -1e9), // temp negative id
                            shoppingListId: listId,
                            name,
                            category: "",
                            quantity: quantity ?? 1,
                            purchased: false,
                        });
                    })
                );
                try {
                    const { data: created } = await queryFulfilled;
                    // replace the temp item with the real one (optional)
                    dispatch(
                        shoppingSlice.util.updateQueryData("getShoppingItems", listId, (draft) => {
                            const idx = draft.findIndex((i) => i.name === name && i.id < 0);
                            if (idx !== -1) draft[idx] = created;
                        })
                    );
                } catch {
                    patch.undo();
                }
            },
        }),

        editShoppingList: builder.mutation<any, { listId: number; title: string; }>({
            query: ({ listId, title }) => ({
                url: `/shopping_lists/${listId}`,
                method: "PUT",
                body: { title },
            }),
            invalidatesTags: (result, error, { listId }) => [{ type: "ShoppingList", id: listId }],
        }),

        completeShoppingItem: builder.mutation<ShoppingItem, { itemId: number; listId: number; purchased: boolean }>({
            query: ({ itemId, purchased }) => ({
                url: `/shopping_items/${itemId}/toggle`,
                method: "PUT",
                body: { purchased },
            }),
            async onQueryStarted({ itemId, listId, purchased }, { dispatch, queryFulfilled }) {
                const patch = dispatch(
                    shoppingSlice.util.updateQueryData("getShoppingItems", listId, (draft) => {
                        const item = draft.find((i) => i.id === itemId);
                        if (item) item.purchased = purchased; // ✅ direct field set
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

        deleteShoppingItem: builder.mutation<{ success: boolean; id: number }, { itemId: number; listId: number }>({
            query: ({ itemId }) => ({
                url: `/shopping_items/${itemId}`,
                method: "DELETE",
            }),
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
        getShoppingListCategories: builder.query<any, number>({
            query: (listId) => `/shopping_lists/${listId}/categories`,
            providesTags: (result, error, listId) =>
                result
                    ? [
                        ...result.map(({ id }: { id: number }) => ({ type: "ShoppingCategory" as const, id })),
                        { type: "ShoppingCategory", id: `LIST_${listId}` },
                    ]
                    : [{ type: "ShoppingCategory", id: `LIST_${listId}` }],
        }),
        getShoppingItemCategory: builder.query<any, number>({
            query: (itemId) => `/shopping_items/${itemId}/category`,
            providesTags: (result, _err, _itemId) =>
                result
                    ? [
                        { type: "ShoppingCategory", id: result.id },
                        { type: "ShoppingCategory", id: `LIST_${result.listId}` }, // if your payload includes listId
                    ]
                    : []
        }),
    })
});

export const {
    useGetShoppingListsQuery,
    useGetShoppingListQuery,
    useAddShoppingItemMutation,
    useGetShoppingItemsQuery,
    useEditShoppingListMutation,
    useCompleteShoppingItemMutation,
    useDeleteShoppingItemMutation,
    useGetShoppingItemCategoryQuery,
    useGetShoppingListCategoriesQuery
} = shoppingSlice;