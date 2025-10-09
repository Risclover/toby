// src/store/shoppingCategorySlice.ts
import { apiSlice } from "./apiSlice";

export type ShoppingCategory = {
    id: number;
    listId: number;
    name: string;
    createdAt: string;
    updatedAt: string;
};

export const shoppingCategorySlice = apiSlice.enhanceEndpoints({
    addTagTypes: ["ShoppingCategory"]
}).injectEndpoints({
    endpoints: (builder) => ({
        // GET ""  — your Flask endpoint expects JSON in the request body with { shoppingListId }
        getShoppingCategories: builder.query<ShoppingCategory[], number>({
            query: (listId) => ({
                url: "/shopping_categories",
                method: "GET",
                body: { shoppingListId: listId }, // Flask code reads request.get_json() even for GET
            }),
            providesTags: (result, _err, listId) =>
                result
                    ? [
                        ...result.map((c) => ({ type: "ShoppingCategory" as const, id: c.id })),
                        { type: "ShoppingCategory" as const, id: `LIST-${listId}` },
                    ]
                    : [{ type: "ShoppingCategory" as const, id: `LIST-${listId}` }],
        }),

        // POST "" — body: { name, shoppingListId }
        createShoppingCategory: builder.mutation<
            ShoppingCategory,
            { listId: number; name: string }
        >({
            query: ({ listId, name }) => ({
                url: `/shopping_categories`,
                method: "POST",
                body: { name, shoppingListId: listId },
            }),
            async onQueryStarted({ listId, name }, { dispatch, queryFulfilled }) {
                const tempId = Math.floor(Math.random() * -1e9);

                // 1) Optimistically add to this slice's query: getShoppingCategories(listId)
                const patchA = dispatch(
                    shoppingCategorySlice.util.updateQueryData(
                        "getShoppingCategories",
                        listId,
                        (draft) => {
                            draft.push({
                                id: tempId,
                                listId,
                                name,
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString(),
                            });
                        }
                    )
                );

                // 2) Also optimistically add to the OTHER query your UI uses:
                //    getShoppingListCategories(listId) (defined in shoppingSlice)
                const patchB = dispatch(
                    apiSlice.util.updateQueryData(
                        "getShoppingListCategories",
                        listId,
                        (draft: any[]) => {
                            draft.push({
                                id: tempId,
                                listId,
                                name,
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString(),
                            });
                        }
                    )
                );

                try {
                    const { data } = await queryFulfilled;

                    // Reconcile temp -> real in both caches
                    dispatch(
                        shoppingCategorySlice.util.updateQueryData(
                            "getShoppingCategories",
                            listId,
                            (draft) => {
                                const i = draft.findIndex((c) => c.id === tempId);
                                if (i !== -1) draft[i] = data;
                            }
                        )
                    );
                    dispatch(
                        apiSlice.util.updateQueryData(
                            "getShoppingListCategories",
                            listId,
                            (draft: any[]) => {
                                const i = draft.findIndex((c) => c.id === tempId);
                                if (i !== -1) draft[i] = data;
                            }
                        )
                    );
                } catch {
                    // Undo both if the request fails
                    patchA.undo();
                    patchB.undo();
                }
            },
            invalidatesTags: (_res, _err, { listId }) => [
                { type: "ShoppingCategory", id: `LIST_${listId}` }, // keep underscore everywhere
            ],
        }),

        // DELETE "/<id>"
        deleteShoppingCategory: builder.mutation<
            { message: string },
            { id: number; listId: number }
        >({
            query: ({ id }) => ({
                url: `/shopping_categories/${id}`,
                method: "DELETE",
            }),
            // optimistic remove
            async onQueryStarted({ id, listId }, { dispatch, queryFulfilled }) {
                const patch = dispatch(
                    shoppingCategorySlice.util.updateQueryData(
                        "getShoppingCategories",
                        listId,
                        (draft) => {
                            const i = draft.findIndex((c) => c.id === id);
                            if (i !== -1) draft.splice(i, 1);
                        }
                    )
                );
                try {
                    await queryFulfilled;
                } catch {
                    patch.undo();
                }
            },
            invalidatesTags: (_res, _err, { listId }) => [
                { type: "ShoppingCategory", id: `LIST-${listId}` },
            ],
        }),
    }),
    overrideExisting: false,
});

// Generated hooks
export const {
    useGetShoppingCategoriesQuery,
    useCreateShoppingCategoryMutation,
    useDeleteShoppingCategoryMutation,
} = shoppingCategorySlice;
