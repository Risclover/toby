import { apiSlice } from "./apiSlice";

export type Category = {
    id: number;
    listId: number;
    name: string;
    createdAt?: string;
    updatedAt?: string;
};


export const categorySlice = apiSlice
    .enhanceEndpoints({ addTagTypes: ["ShoppingCategory"] })
    .injectEndpoints({
        endpoints: (builder) => ({
            getShoppingCategories: builder.query<Category[], number>({
                query: (listId) => `/shopping_lists/${listId}/categories`,
                providesTags: (result, _err, listId) =>
                    result
                        ? [
                            ...result.map((c) => ({ type: "ShoppingCategory" as const, id: c.id })),
                            { type: "ShoppingCategory", id: `LIST_${listId}` },
                        ]
                        : [{ type: "ShoppingCategory", id: `LIST_${listId}` }],
            }),

            createShoppingCategory: builder.mutation<Category, { listId: number; name: string }>({
                query: ({ listId, name }) => ({
                    url: `/shopping_lists/${listId}/categories`,
                    method: "POST",
                    body: { name },
                }),
                async onQueryStarted({ listId, name }, { dispatch, queryFulfilled }) {
                    const tempId = Math.floor(Math.random() * -1e9);
                    const patch = dispatch(
                        categorySlice.util.updateQueryData("getShoppingCategories", listId, (draft) => {
                            draft.push({
                                id: tempId,
                                listId,
                                name,
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString(),
                            });
                        })
                    );
                    try {
                        const { data } = await queryFulfilled;
                        dispatch(
                            categorySlice.util.updateQueryData("getShoppingCategories", listId, (draft) => {
                                const i = draft.findIndex((c) => c.id === tempId);
                                if (i !== -1) draft[i] = data;
                            })
                        );
                    } catch {
                        patch.undo();
                    }
                },
                invalidatesTags: (_r, _e, { listId }) => [{ type: "ShoppingCategory", id: `LIST_${listId}` }],
            }),

            deleteShoppingCategory: builder.mutation<{ success: boolean }, { categoryId: number; listId: number }>({
                query: ({ categoryId }) => ({
                    url: `/shopping_categories/${categoryId}`,
                    method: "DELETE",
                }),
                async onQueryStarted({ categoryId, listId }, { dispatch, queryFulfilled }) {
                    const patch = dispatch(
                        categorySlice.util.updateQueryData("getShoppingCategories", listId, (draft) => {
                            const i = draft.findIndex((c) => c.id === categoryId);
                            if (i !== -1) draft.splice(i, 1);
                        })
                    );
                    try {
                        await queryFulfilled;
                    } catch {
                        patch.undo();
                    }
                },
                invalidatesTags: (_r, _e, { listId }) => [{ type: "ShoppingCategory", id: `LIST_${listId}` }],
            }),
        }),
    });

export const {
    useGetShoppingCategoriesQuery,
    useCreateShoppingCategoryMutation,
    useDeleteShoppingCategoryMutation,
} = categorySlice;
