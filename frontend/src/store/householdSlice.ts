import { apiSlice } from "./apiSlice";

export type Household = { id: number; name: string };
export type TodoList = { id: number; title: string; createdAt: string; memberIds: number[] };
type TodoListTag = { type: "TodoList"; id: number | string };

export type ShoppingList = {
    id: number;
    householdId: number;
    title: string;
    createdAt?: string;
    items: any[];
    categories: string[];
};

// arg type for this query
type GetHouseholdShoppingListArgs = {
    householdId: number;
    listId: number;
};

export const householdSlice = apiSlice.enhanceEndpoints({ addTagTypes: ["Household", "TodoList", "ShoppingList"] }).injectEndpoints({
    endpoints: (builder) => ({
        getHousehold: builder.query({
            query: (householdId) => `/households/${householdId}`,
            providesTags: (result, error, householdId) => {
                void result; void error;
                return [{ type: "Household", id: householdId }]
            }
        }),
        getHouseholdTodoLists: builder.query<TodoList[], number>({
            query: (householdId) => `/households/${householdId}/todo_lists`, // no leading slash
            providesTags: (result, _e, householdId): TodoListTag[] =>
                result?.length
                    ? [
                        ...result.map((l) => ({ type: "TodoList", id: l.id } as TodoListTag)),
                        { type: "TodoList", id: `HOUSEHOLD_${householdId}` },
                    ]
                    : [{ type: "TodoList", id: `HOUSEHOLD_${householdId}` }],

        }),
        getHouseholdShoppingLists: builder.query<any, number>({
            query: (householdId) => `/households/${householdId}/shopping`,
            providesTags: (result, _e, householdId) =>
                result?.length
                    ? [
                        ...result.map((sl: { id: number }) => ({ type: "ShoppingList" as const, id: sl.id })),
                        { type: "ShoppingList", id: `HOUSEHOLD_${householdId}` },
                    ]
                    : [{ type: "ShoppingList", id: `HOUSEHOLD_${householdId}` }],
        }),

        getHouseholdShoppingList: builder.query<ShoppingList, GetHouseholdShoppingListArgs>({
            query: ({ householdId, listId }) =>
                `/households/${householdId}/shopping/${listId}`,
            providesTags: (_result, _err, { listId }) => [{ type: "ShoppingList", id: listId }],
        }),
    })
})

export const {
    useGetHouseholdQuery,
    useGetHouseholdTodoListsQuery,
    useGetHouseholdShoppingListsQuery,
    useGetHouseholdShoppingListQuery
} = householdSlice;