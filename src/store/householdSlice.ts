import { apiSlice } from "./apiSlice";

export type Household = { id: number; name: string };
export type TodoList = { id: number; title: string; createdAt: string; memberIds: number[] };

const householdSlice = apiSlice.enhanceEndpoints({ addTagTypes: ["Household", "TodoList"] }).injectEndpoints({
    endpoints: (builder) => ({
        getHousehold: builder.query({
            query: (householdId) => `/households/${householdId}`,
            providesTags: (result, error, householdId) => [{ type: "Household", id: householdId }],
        }),
        getHouseholdTodoLists: builder.query<TodoList[], number>({
            query: (householdId) => `households/${householdId}/todo_lists`, // no leading slash
            providesTags: (result, _error, householdId) =>
                result?.length
                    ? [
                        ...result.map((l) => ({ type: "TodoList" as const, id: l.id })),
                        { type: "TodoList" as const, id: `HOUSEHOLD_${householdId}` }, // list “bucket”
                    ]
                    : [{ type: "TodoList" as const, id: `HOUSEHOLD_${householdId}` }],

        })
    })
})

export const { useGetHouseholdQuery, useGetHouseholdTodoListsQuery } = householdSlice;