import { apiSlice } from "./apiSlice";
import type { TasklistType } from "./taskSlice";

export type Household = { id: number; firstName: string; adminId: number };
type Tasklist = { id: number; title: string; createdAt: string; memberIds: number[] };
type TasklistTag = { type: "Tasklist"; id: number | string };
type ShoppingCategory = { id: number; listId: number; name: string; createdAt: string; updatedAt: string };

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

type Announcement = {
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
        getHouseholdTasklists: builder.query<TasklistType[], number>({
            query: (householdId) => `/households/${householdId}/tasklists`, // no leading slash
            providesTags: (result, _e, householdId): TasklistTag[] =>
                result?.length
                    ? [
                        ...result.map((l) => ({ type: "Tasklist", id: l.id } as TasklistTag)),
                        { type: "Tasklist", id: `HOUSEHOLD_${householdId}` },
                    ]
                    : [{ type: "Tasklist", id: `HOUSEHOLD_${householdId}` }],

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

        removeHouseholdMember: builder.mutation<void, { householdId: number; userId: number }>({
            query: ({ householdId, userId }) => ({
                url: `/households/${householdId}/members/${userId}`,
                method: "DELETE",
            }),
            invalidatesTags: (_result, _error, { householdId }) => [
                { type: "Household", id: householdId }
            ],
        }),

        transferAdminRole: builder.mutation<Household, { householdId: number; userId: number }>({
            query: ({ householdId, userId }) => ({
                url: `/households/${householdId}/admin`,
                method: "PATCH",
                body: { newAdminId: userId },
            }),
            invalidatesTags: (_result, _error, { householdId }) => [
                { type: "Household", id: householdId }
            ],
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
    useGetHouseholdTasklistsQuery,
    useGetHouseholdShoppingListsQuery,
    useGetHouseholdShoppingListQuery,
    useRemoveHouseholdMemberMutation,
    useTransferAdminRoleMutation,
} = householdSlice;