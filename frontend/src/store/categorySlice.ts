import { create } from "domain";
import { apiSlice } from "./apiSlice";


export const categorySlice = apiSlice.enhanceEndpoints({ addTagTypes: ["ShoppingCategory"] }).injectEndpoints({
    endpoints: (builder) => ({
        getShoppingCategories: builder.query<any, number>({
            query: (listId) => `/shopping_lists/${listId}/categories`,
            providesTags: (result, error, listId) =>
                result
                    ? [
                        ...result.map(({ id }: { id: number }) => ({ type: "ShoppingCategory" as const, id })),
                        { type: "ShoppingCategory", id: `LIST_${listId}` },
                    ]
                    : [{ type: "ShoppingCategory", id: `LIST_${listId}` }],
        }),
        createShoppingCategory: builder.mutation<any, { listId: number; name: string }>({
            query: ({ listId, name }) => ({
                url: `/shopping_lists/${listId}/categories`,
                method: "POST",
                body: { name },
            }),
            async onQueryStarted({ listId, name }, { dispatch, queryFulfilled }) {
                // optimistic: push a temp item into the cache
                const patch = dispatch(
                    categorySlice.util.updateQueryData("getShoppingCategories", listId, (draft) => {
                        draft.push({
                            id: Math.floor(Math.random() * -1e9), // temp negative id
                            listId,
                            name,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                        });
                    })
                );
                try { await queryFulfilled; } catch { patch.undo(); }
            },
            invalidatesTags: (result, error, { listId }) => [{ type: "ShoppingCategory", id: `LIST_${listId}` }],
        }),
        deleteShoppingCategory: builder.mutation<any, { categoryId: number; listId: number }>({
            query: ({ categoryId }) => ({
                url: `/shopping_categories/${categoryId}`,
                method: "DELETE",
            }),
            async onQueryStarted({ categoryId, listId }, { dispatch, queryFulfilled }) {
                // optimistic: remove the item from the cache
                const patch = dispatch(
                    categorySlice.util.updateQueryData("getShoppingCategories", listId, (draft) => {
                        return draft.filter((cat) => cat.id !== categoryId);
                    })
                );
                try { await queryFulfilled; } catch { patch.undo(); }
            },
            invalidatesTags: (result, error, { listId }) => [{ type: "ShoppingCategory", id: `LIST_${listId}` }],
        }),
    })
})

export const {
    useGetShoppingCategoriesQuery,
} = categorySlice;      