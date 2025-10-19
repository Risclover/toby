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
    householdId: number;
    authorId: number;
    body: string;
    createdAt: string;
    updatedAt?: string | null;
    expiresAt?: string | null;
    pinned: boolean;
    pinnedAt?: string | null;
    pinnedBy?: number | null;
    archivedAt?: string | null;
    /** server-computed for the calling user */
    seen: boolean;
};

const scopeTag = (householdId: number, scope: "active" | "history") =>
    ({ type: "Announcement" as const, id: `HOUSEHOLD_${householdId}_${scope.toUpperCase()}` });
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

        getAnnouncements: builder.query<AnnouncementListResponse, GetAnnouncementsArgs>({
            query: ({ householdId, scope = "active" }) => ({
                url: `/households/${householdId}/announcements`,
                params: { scope },
            }),
            providesTags: (result, _err, { householdId, scope = "active" }) => {
                const base = [scopeTag(householdId, scope)];
                if (!result?.items?.length) return base;
                return [
                    ...base,
                    ...result.items.map((a) => ({ type: "Announcement" as const, id: a.id })),
                ];
            },
        }),

        /** POST /households/:hid/announcements */
        createAnnouncement: builder.mutation<Announcement, CreateAnnouncementArgs>({
            query: ({ householdId, body, ttlMode, ttlHours }) => ({
                url: `/households/${householdId}/announcements`,
                method: "POST",
                body: { body, ttlMode, ttlHours },
            }),
            // Invalidate active list; (optionally) also invalidate history if you surface it anywhere.
            invalidatesTags: (_res, _err, { householdId }) => [
                scopeTag(householdId, "active"),
            ],
            // Optional optimistic push into active list
            async onQueryStarted({ householdId, body }, { dispatch, queryFulfilled }) {
                const patch = dispatch(
                    householdSlice.util.updateQueryData(
                        "getAnnouncements",
                        { householdId, scope: "active" },
                        (draft) => {
                            if (!draft.items) draft.items = [];
                            const tempId = Math.floor(Math.random() * -1e9);
                            draft.items.unshift({
                                id: tempId,
                                householdId,
                                authorId: -1, // your UI can swap to real authorId after server returns
                                body,
                                createdAt: new Date().toISOString(),
                                updatedAt: null,
                                expiresAt: null, // server will set
                                pinned: false,
                                pinnedAt: null,
                                pinnedBy: null,
                                archivedAt: null,
                                seen: false,
                            });
                        }
                    )
                );
                try {
                    const { data } = await queryFulfilled;
                    // Swap temp row with real one
                    dispatch(
                        householdSlice.util.updateQueryData(
                            "getAnnouncements",
                            { householdId, scope: "active" },
                            (draft) => {
                                const i = draft.items.findIndex((a) => a.id < 0);
                                if (i !== -1) draft.items[i] = data;
                            }
                        )
                    );
                } catch {
                    patch.undo();
                }
            },
        }),
    })
})

export const {
    useGetHouseholdQuery,
    useGetHouseholdTodoListsQuery,
    useGetHouseholdShoppingListsQuery,
    useGetHouseholdShoppingListQuery,
    useCreateAnnouncementMutation,
    useGetAnnouncementsQuery,
} = householdSlice;