import { apiSlice } from "./apiSlice";

export type Household = { id: number; name: string };
export type TodoList = { id: number; title: string; createdAt: string; memberIds: number[] };
type TodoListTag = { type: "TodoList"; id: number | string };

const householdSlice = apiSlice.enhanceEndpoints({ addTagTypes: ["Household", "TodoList"] }).injectEndpoints({
    endpoints: (builder) => ({
        getHousehold: builder.query({
            query: (householdId) => `/households/${householdId}`,
            providesTags: (result, error, householdId) => [{ type: "Household", id: householdId }],
        }),
        getHouseholdTodoLists: builder.query<TodoList[], number>({
            query: (householdId) => `households/${householdId}/todo_lists`, // no leading slash
            providesTags: (result, _e, householdId): TodoListTag[] =>
                result?.length
                    ? [
                        ...result.map((l) => ({ type: "TodoList", id: l.id } as TodoListTag)),
                        { type: "TodoList", id: `HOUSEHOLD_${householdId}` },
                    ]
                    : [{ type: "TodoList", id: `HOUSEHOLD_${householdId}` }],

        })
    })
})

export const { useGetHouseholdQuery, useGetHouseholdTodoListsQuery } = householdSlice;