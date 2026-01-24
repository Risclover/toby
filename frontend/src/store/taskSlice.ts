import { apiSlice } from "./apiSlice";
import { householdSlice } from "./householdSlice"; // 👈 add this import

export interface Task {
    id: number;
    title: string;
    description?: string;
    status: "pending" | "in_progress" | "completed";
    isImportant: boolean;
    sortIndex: number;
    dueDate?: string | Date | undefined | null;
    assignedToId?: number | undefined | null;
    listId: number;
    notes: string | undefined;
    createdAt: string;   // <- camelCase
    updatedAt: string;
    completedAt: string | null;
}

export interface TasklistType {
    id: number;
    title: string;
    icon: string;
    color: string;
    viewMode: string;
    newItemPosition: string;
    showCompleted: boolean;
    isArchived: boolean;
    defaultSortOrder: string;
    defaultFilters: {
        importance: "all" | "important";
        assignedToId: null | number; // userId
        time:
        | "past_due"
        | "today"
        | "tomorrow"
        | "this_week"
        | "this_month"
        | "all";
    };
    userId?: number;
    householdId?: number;
    memberIds?: number[];
    tasks?: Task[];
    createdAt: string;   // <- camelCase
    updatedAt?: string;
    members?: string[];
    allMembers: boolean;
    starsAtTop: boolean;
}

type CreateTasklistBase = {
    title: string;
}

type CreateForUser = CreateTasklistBase & {
    userId: number;
    householdId?: never;
    allMembers?: never;
    memberIds?: never;
}

type CreateForHousehold = CreateTasklistBase & {
    householdId: number;
    allMembers: true;          // literal true
    memberIds?: never;         // must be absent
    userId?: never;
}

type CreateForHouseholdSubset = CreateTasklistBase & {
    householdId: number;
    allMembers: false;         // literal false
    memberIds: number[];       // required now
    userId?: never;
};

// Request types
export type CreateTasklistRequest = CreateForUser | CreateForHousehold | CreateForHouseholdSubset

export interface CreateTaskRequest {
    title: string;
    description?: string;
    status?: "pending" | "in_progress" | "completed";
    isImportant: boolean;
    dueDate?: string | Date | undefined;
    assignedToId?: number | undefined | null;
    listId: number | undefined;
}

export type ReorderPayload = {
    listId: number;
    orderedIds: number[];
    householdId?: number; // pass when you have it; we’ll try to derive if not
};

export interface DeleteTaskRequest {
    listId: number;
    taskId: number;
}

export interface ClearListRequest {
    listId: number;
}

export interface DeleteListRequest {
    listId: number | undefined;
}

export interface CompleteTaskRequest {
    taskId?: number;
    listId: number;
    completed: boolean;
    householdId?: number;
}

export interface ToggleImportanceRequest {
    taskId: number;
    listId: number;
    householdId?: number;
}

export interface ArchiveListRequest {
    listId: number;
}

type UpdateTaskPatch = Partial<
    Pick<Task, "isImportant" | "status" | "title" | "description" | "dueDate" | "assignedToId" | "notes">
>;

type TasklistTag = { type: "Tasklist"; id: number | string };

export const taskSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getTask: builder.query({
            query: (taskId) => `/tasks/${taskId}`,
            providesTags: (_res, _err, taskId) => [{ type: "Task", id: taskId }]
        }),
        getTasklist: builder.query<TasklistType, number | undefined>({
            query: (tasklistId) => `/tasklists/${tasklistId}`,
            providesTags: (_res, _err, tasklistId): TasklistTag[] => {
                return [
                    { type: "Tasklist", id: tasklistId ?? "LIST" }, // string | number
                ]
            }
        }),

        getTasklists: builder.query<TasklistType[], number>({
            query: (householdId) => `/tasklists/${householdId}`,
            providesTags: (result, _error, householdId): TasklistTag[] =>
                result?.length
                    ? [
                        ...result.map((l) => ({ type: "Tasklist", id: l.id } as TasklistTag)),
                        { type: "Tasklist", id: `HOUSEHOLD_${householdId}` }, // string tag ok
                        { type: "Tasklist", id: "LIST" },
                    ]
                    : [
                        { type: "Tasklist", id: `HOUSEHOLD_${householdId}` },
                        { type: "Tasklist", id: "LIST" },
                    ],
        }),

        completeTask: builder.mutation<Task, CompleteTaskRequest>({
            query: ({ taskId, completed }) => ({
                url: `/tasks/${taskId}/completed`,
                method: "PUT",
                body: { completed },
            }),
            invalidatesTags: (_res, _err, { listId, householdId }): TasklistTag[] => {
                const tags: TasklistTag[] = [{ type: "Tasklist", id: listId }];
                if (householdId != null) tags.push({ type: "Tasklist", id: `HOUSEHOLD_${householdId}` });
                // keep the list “bucket” fresh too
                tags.push({ type: "Tasklist", id: "LIST" });
                return tags;
            },
        }),

        createHouseholdTasklist: builder.mutation<TasklistType, CreateTasklistRequest>({
            query: (arg) => {
                // user-owned
                if ("userId" in arg) {
                    const { title, userId } = arg;
                    return {
                        url: "tasklists",
                        method: "POST",
                        body: { title, user_id: userId },
                    };
                }

                // household-owned
                const { title, householdId, allMembers } = arg;
                return {
                    url: `households/${householdId}/tasklists`,
                    method: "POST",
                    body: {
                        title,
                        allMembers,
                        ...(allMembers === false ? { memberIds: arg.memberIds } : {}),
                    },
                };
            },
            invalidatesTags: (result) =>
                result
                    ? [
                        { type: "Tasklist", id: result.id },
                        result.householdId
                            ? { type: "Tasklist", id: `HOUSEHOLD_${result.householdId}` }
                            : { type: "Tasklist", id: `USER_${result.userId}` },
                    ]
                    : [],
        }),

        addTask: builder.mutation<Task, CreateTaskRequest>({
            query: ({ title, description, status, isImportant, dueDate, assignedToId, listId }) => ({
                url: `/tasklists/${listId}/tasks`,
                method: "POST",
                body: {
                    title,
                    description,
                    status,
                    isImportant,
                    due_date: dueDate,
                    assigned_to_id: assignedToId,
                    list_id: listId,
                },
            }),
            invalidatesTags: (_res, _err, arg: CreateTaskRequest) => {
                return [{ type: "Tasklist", id: arg.listId }]
            }
        }),

        deleteTask: builder.mutation<Task, DeleteTaskRequest>({
            query: ({ listId, taskId }) => ({
                url: `/tasklists/${listId}/tasks/${taskId}`,
                method: "DELETE",
            }),
            invalidatesTags: (_res, _err, arg: DeleteTaskRequest) => {
                return [{ type: "Tasklist", id: arg.listId }]
            }
        }),

        clearList: builder.mutation<{ message: string }, ClearListRequest>({
            query: ({ listId }) => ({
                url: `/tasklists/${listId}/tasks`,
                method: "DELETE",
            }),
            invalidatesTags: (_res, _err, arg: ClearListRequest) => {
                return [{ type: "Tasklist", id: arg.listId }]
            }
        }),

        deleteList: builder.mutation<{ message: string }, DeleteListRequest>({
            query: ({ listId }) => ({
                url: `/tasklists/${listId}`,
                method: "DELETE",
            }),
            invalidatesTags: (_res, _err, arg: DeleteListRequest) => {
                return [{ type: "Tasklist", id: arg.listId }, { type: "Tasklist", id: "LIST" }]
            }
        }),

        updateTasklist: builder.mutation({
            // Add householdId to the argument destructuring, but ignore it for the query
            query: ({ listId, data, householdId }) => ({
                url: `/tasklists/${listId}/settings`,
                method: "PUT",
                body: data
            }),

            // Now householdId will be available here!
            invalidatesTags: (_res, _err, { listId, householdId }): TasklistTag[] => {
                const tags: TasklistTag[] = [{ type: "Tasklist", id: listId }];

                if (householdId != null) {
                    tags.push({ type: "Tasklist", id: `HOUSEHOLD_${householdId}` });
                } else {
                    // Fallback: Invalidate *all* lists if we don't know the household
                    // This ensures the list reappears even if we forgot the ID
                    tags.push({ type: "Tasklist", id: "LIST" });
                }

                return tags;
            },
        }),

        updateTask: builder.mutation<Task, { taskId: number; listId: number; householdId?: number } & UpdateTaskPatch>({
            query: ({ taskId, listId, householdId, ...patch }) => ({
                url: `/tasks/${taskId}`,
                method: "PATCH",
                body: patch,
            }),
            async onQueryStarted({ taskId, listId, householdId, ...patch }, { dispatch, getState, queryFulfilled }) {
                const p1 = dispatch(
                    taskSlice.util.updateQueryData("getTasklist", listId, (draft) => {
                        const task = draft?.tasks?.find(x => x.id === taskId);
                        if (task) {
                            Object.entries(patch).forEach(([key, value]) => { if (value !== undefined) (task as any)[key] = value; });
                            (task as any).updatedAt = new Date().toISOString();
                        }
                    })
                );

                if (householdId == null) {
                    const sel = taskSlice.endpoints.getTasklist.select(listId)(getState() as any);
                    householdId = sel?.data?.householdId ?? undefined;
                }

                const p2 = householdId != null
                    ? dispatch(
                        householdSlice.util.updateQueryData("getHouseholdTasklists", householdId, (lists: any[] | undefined) => {
                            const list = lists?.find(l => l.id === listId);
                            const task = list?.tasks?.find((x: any) => x.id === taskId);
                            if (task) {
                                Object.entries(patch).forEach(([key, value]) => { if (value !== undefined) (task as any)[key] = value; });
                                task.updatedAt = new Date().toISOString();
                            }
                        })
                    )
                    : { undo: () => { } };

                const pSingle = dispatch(
                    taskSlice.util.updateQueryData("getTask", taskId, (draft: any) => {
                        if (draft) Object.assign(draft, patch, { updatedAt: new Date().toISOString() });
                    })
                );
                try { await queryFulfilled; } catch { p1.undo(); p2.undo?.(); pSingle.undo(); }
            },
            invalidatesTags: (_r, _e, { taskId, listId, householdId }) => {
                const tags: any[] = [
                    { type: "Tasklist", id: listId },
                    { type: "Tasklist", id: "LIST" },
                    { type: "Task", id: taskId }, // ✅ refetch single-task queries
                ];
                if (householdId != null) tags.push({ type: "Tasklist", id: `HOUSEHOLD_${householdId}` });
                return tags;
            },
        }),

        toggleTaskImportance: builder.mutation<Task, ToggleImportanceRequest>({
            query: ({ taskId }) => ({
                url: `/tasks/${taskId}/importance`,
                method: "PUT",
            }),
            async onQueryStarted({ taskId, listId, householdId }, { dispatch, getState, queryFulfilled }) {
                // Optimistic Update 1: Update the specific List view
                const p1 = dispatch(
                    taskSlice.util.updateQueryData("getTasklist", listId, (draft) => {
                        const task = draft?.tasks?.find(t => t.id === taskId);
                        if (task) {
                            task.isImportant = !task.isImportant;
                        }
                    })
                );

                // Attempt to find householdId if not passed
                if (householdId == null) {
                    const sel = taskSlice.endpoints.getTasklist.select(listId)(getState() as any);
                    householdId = sel?.data?.householdId ?? undefined;
                }

                // Optimistic Update 2: Update the Household dashboard view
                const p2 = householdId != null
                    ? dispatch(
                        householdSlice.util.updateQueryData("getHouseholdTasklists", householdId, (lists: any[] | undefined) => {
                            const list = lists?.find(l => l.id === listId);
                            const task = list?.tasks?.find((x: any) => x.id === taskId);
                            if (task) {
                                task.isImportant = !task.isImportant;
                            }
                        })
                    )
                    : { undo: () => { } };

                // Optimistic Update 3: Single Task View
                const p3 = dispatch(
                    taskSlice.util.updateQueryData("getTask", taskId, (draft: any) => {
                        if (draft) draft.isImportant = !draft.isImportant;
                    })
                );

                try {
                    await queryFulfilled;
                } catch {
                    p1.undo();
                    p2.undo?.();
                    p3.undo();
                }
            },
            invalidatesTags: (_res, _err, { listId, taskId }) => [
                { type: "Tasklist", id: listId },
                { type: "Task", id: taskId }
            ],
        }),

        reorderTasks: builder.mutation<void, ReorderPayload>({
            query: ({ listId, orderedIds }) => ({
                url: `/tasklists/${listId}/reorder`,
                method: "PATCH",
                body: { orderedIds },
            }),
            async onQueryStarted({ listId, orderedIds, householdId }, { dispatch, getState, queryFulfilled }) {
                // 1) Patch the single list detail
                const p1 = dispatch(
                    taskSlice.util.updateQueryData("getTasklist", listId, (draft: TasklistType | undefined) => {
                        if (!draft?.tasks) return;
                        draft.tasks.sort((a, b) => orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id));
                        draft.tasks.forEach((t, i) => (t.sortIndex = i));
                    })
                );

                // Infer householdId if missing
                if (householdId == null) {
                    const sel = taskSlice.endpoints.getTasklist.select(listId)(getState() as any);
                    householdId = sel?.data?.householdId ?? undefined;
                }

                // 2) Patch the household grid (endpoint lives on householdSlice)
                const p2 =
                    householdId != null
                        ? dispatch(
                            householdSlice.util.updateQueryData(
                                "getHouseholdTasklists",
                                householdId, // must match useGetHouseholdTasklistsQuery arg
                                (lists: any[] | undefined) => {
                                    if (!lists) return;
                                    const target = lists.find((l) => l.id === listId);
                                    if (!target?.tasks) return;
                                    target.tasks.sort((a: any, b: any) => orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id));
                                    target.tasks.forEach((t: any, i: number) => (t.sortIndex = i));
                                }
                            )
                        )
                        : { undo: () => { } };

                try {
                    await queryFulfilled;
                } catch {
                    p1.undo();
                    p2.undo?.();
                }
            },
        }),

        archiveList: builder.mutation<TasklistType, ArchiveListRequest>({
            query: ({ listId }) => ({
                url: `/tasklists/${listId}/archive`,
                method: "PUT",
            }),
            async onQueryStarted({ listId }, { dispatch, queryFulfilled, getState }) {
                // Optimistic Update: Mark list as archived in cache
                const patchResult = dispatch(
                    taskSlice.util.updateQueryData("getTasklist", listId, (draft) => {
                        draft.isArchived = true;
                    })
                );

                // Also update the household list view if possible (to remove it or gray it out)
                // (Optional, depends on if you want it to disappear instantly)

                try {
                    await queryFulfilled;
                } catch {
                    patchResult.undo();
                }
            },
            invalidatesTags: (result, error, arg) => [
                { type: "Tasklist", id: arg.listId },
                { type: "Tasklist", id: "LIST" }, // Refetch the list of lists so it disappears from sidebar
                // If you use HOUSEHOLD tags for the sidebar list:
                ...(result?.householdId ? [{ type: "Tasklist", id: `HOUSEHOLD_${result.householdId}` } as const] : [])
            ],
        }),

        unarchiveList: builder.mutation<TasklistType, ArchiveListRequest>({
            query: ({ listId }) => ({
                url: `/tasklists/${listId}/unarchive`,
                method: "PUT",
            }),
            async onQueryStarted({ listId }, { dispatch, queryFulfilled, getState }) {
                // Optimistic Update: Mark list as archived in cache
                const patchResult = dispatch(
                    taskSlice.util.updateQueryData("getTasklist", listId, (draft) => {
                        draft.isArchived = false;
                    })
                );

                // Also update the household list view if possible (to remove it or gray it out)
                // (Optional, depends on if you want it to disappear instantly)

                try {
                    await queryFulfilled;
                } catch {
                    patchResult.undo();
                }
            },
            invalidatesTags: (result, error, arg) => [
                { type: "Tasklist", id: arg.listId },
                { type: "Tasklist", id: "LIST" }, // Refetch the list of lists so it disappears from sidebar
                // If you use HOUSEHOLD tags for the sidebar list:
                ...(result?.householdId ? [{ type: "Tasklist", id: `HOUSEHOLD_${result.householdId}` } as const] : [])
            ],
        }),
    }),
})

export const {
    useGetTaskQuery,
    useGetTasklistQuery,
    useGetTasklistsQuery,
    useCreateHouseholdTasklistMutation,
    useAddTaskMutation,
    useDeleteTaskMutation,
    useClearListMutation,
    useDeleteListMutation,
    useCompleteTaskMutation,
    useUpdateTasklistMutation,
    useUpdateTaskMutation,
    useToggleTaskImportanceMutation,
    useReorderTasksMutation,
    useArchiveListMutation,
    useUnarchiveListMutation
} = taskSlice;
