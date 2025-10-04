import { apiSlice } from "./apiSlice";

export type ShoppingItem = {
    id: number;
    shoppingListId: number;
    name: string;
    quantity: number;
    purchased: boolean;
    // add categoryId/categoryName if you return them
};

export const shoppingSlice = apiSlice.enhanceEndpoints({ addTagTypes: ["ShoppingList", "ShoppingItem"] }).injectEndpoints({
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
    })
});

export const { useGetShoppingListsQuery, useGetShoppingListQuery, useAddShoppingItemMutation, useGetShoppingItemsQuery } = shoppingSlice;