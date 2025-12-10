import { apiSlice } from "./apiSlice";

export type Household = { id: number; name: string };
export type TodoList = { id: number; title: string; createdAt: string; memberIds: number[] };
type TodoListTag = { type: "TodoList"; id: number | string };
export type ShoppingCategory = { id: number; listId: number; name: string; createdAt: string; updatedAt: string };

export type ShoppingList = {
    id: number;
    householdId: number;
    title: string;
    createdAt?: string;
    items: any[];
    categories: ShoppingCategory[];
};

// arg type for this query
type GetHouseholdShoppingListArgs = {
    householdId: number;
    listId: number;
};

export type AnnouncementListResponse = {
    items: Announcement[];
    nextCursor?: string | null; // your active list won’t use this
};

export type GetAnnouncementsArgs = {
    householdId: number;
    scope?: "active" | "history"; // default active
};

export type CreateAnnouncementArgs = {
    householdId: number;
    body: string;
    // Optional per-request overrides if you allow them:
    ttlMode?: "rolling" | "midnight";
    ttlHours?: number;
};

export type Announcement = {
    id: number;
    userId: number;
    householdId: number;
    message: string;
    isImportant: boolean;
    createdAt?: string | null;
}


export const householdSlice = apiSlice.injectEndpoints({
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

        // getAnnouncements: builder.query<Announcement[], { householdId: number }>({
        //     query: ({ householdId }) => `households/${householdId}/announcements`,
        //     providesTags: (result, _err, { householdId }) =>
        //         result?.length
        //             ? [
        //                 ...result.map((a) => ({ type: "Announcement" as const, id: a.id })),
        //                 { type: "Announcement", id: `HOUSEHOLD_${householdId}` },
        //             ]
        //             : [{ type: "Announcement", id: `HOUSEHOLD_${householdId}` }],
        // })
    })
})

export const {
    useGetHouseholdQuery,
    useGetHouseholdTodoListsQuery,
    useGetHouseholdShoppingListsQuery,
    useGetHouseholdShoppingListQuery,
    useGetAnnouncementsQuery,
} = householdSlice;