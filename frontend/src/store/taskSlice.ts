import { authSlice, type RootState } from ".";
import { apiSlice } from "./apiSlice";
import { householdSlice } from "./householdSlice"; // 👈 add this import
import { featuredListSettingsSlice } from "./featuredListSettingSlice";

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
    archivedBy: {
        id: number;
        profileImg: string | null;
        firstName: string;
        lastName: string;
    } | null;
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
    creatorId?: number;
    householdId?: number;
    memberIds?: number[];
    tasks?: Task[];
    createdAt: string;   // <- camelCase
    updatedAt?: string;
    members?: string[];
    allMembers: boolean;
    isFeatured: boolean;
}

type CreateTasklistBase = {
    title: string;
}

type CreateForUser = CreateTasklistBase & {
    creatorId: number;
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
    householdId?: number;
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
    setToManual: boolean;
};

export interface DeleteTaskRequest {
    listId: number;
    taskId: number;
    householdId?: number;
}

export interface ClearListRequest {
    listId: number;
}

export interface DeleteListRequest {
    listId: number | undefined;
    householdId?: number;
}

export interface CompleteTaskRequest {
    taskId?: number;
    listId: number | undefined;
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

export interface DuplicateListRequest {
    listId: number;
    // Note: If you later update your backend to accept a "mode" (e.g. Copy only active tasks),
    // you would add that property here.
}

interface GetTasklistsArgs {
    householdId: number;
    isArchived: boolean;
}

type UpdateTaskPatch = Partial<
    Pick<Task, "isImportant" | "status" | "title" | "description" | "dueDate" | "assignedToId" | "notes">
>;

type TasklistTag = { type: "Tasklist"; id: number | string };

// Converts Date or string → YYYY-MM-DD (no timezone shift)
const toDateOnlyString = (value?: string | Date | null): string | null => {
    if (!value) return null;
    if (typeof value === "string") return value.split("T")[0];
    return value.toISOString().split("T")[0];
};

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

        getTasklists: builder.query<TasklistType[], GetTasklistsArgs>({
            query: ({ householdId, isArchived }) => ({
                url: `/households/${householdId}/tasklists`,
                params: { is_archived: isArchived },
            }),
            providesTags: (result, _error, { householdId, isArchived }): TasklistTag[] => {
                const status = isArchived ? "ARCHIVED" : "ACTIVE";
                const tags: TasklistTag[] = [
                    { type: "Tasklist", id: "LIST" },
                    { type: "Tasklist", id: `HOUSEHOLD_${householdId}` },
                    { type: "Tasklist", id: `HOUSEHOLD_${householdId}_${status}` },
                ];

                if (result) {
                    return [
                        ...tags,
                        ...result.map((l) => ({ type: "Tasklist" as const, id: l.id })),
                    ];
                }
                return tags;
            },
        }),

        completeTask: builder.mutation<Task, CompleteTaskRequest>({
            query: ({ taskId, completed }) => ({
                url: `/tasks/${taskId}/completed`,
                method: "PUT",
                body: { completed },
            }),
            invalidatesTags: (_res, _err, { listId, householdId }): any[] => {
                const tags: any[] = [
                    { type: "Tasklist", id: listId },
                    { type: "Tasklist", id: "LIST" },
                    "UserTaskStats",
                ];
                if (householdId != null) {
                    tags.push({ type: "Tasklist", id: `HOUSEHOLD_${householdId}` });
                    tags.push({ type: "Activity", id: `HOUSEHOLD_${householdId}` });
                }
                return tags;
            },
        }),

        createHouseholdTasklist: builder.mutation<TasklistType, CreateTasklistRequest>({
            query: (arg) => {
                // user-owned
                if ("creatorId" in arg) {
                    const { title, creatorId } = arg;
                    return {
                        url: "tasklists",
                        method: "POST",
                        body: { title, creator_id: creatorId },
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
                            : { type: "Tasklist", id: `USER_${result.creatorId}` },
                        ...(result.householdId
                            ? [{ type: "Activity" as const, id: `HOUSEHOLD_${result.householdId}` }]
                            : []),
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
            invalidatesTags: (_res, _err, arg) => {
                const tags: any[] = [
                    { type: "Tasklist", id: arg.listId },
                    "UserTaskStats",
                ];
                if (arg.householdId != null) {
                    tags.push({ type: "Activity", id: `HOUSEHOLD_${arg.householdId}` });
                }
                return tags;
            },
        }),

        deleteTask: builder.mutation<Task, DeleteTaskRequest>({
            query: ({ listId, taskId }) => ({
                url: `/tasklists/${listId}/tasks/${taskId}`,
                method: "DELETE",
            }),
            invalidatesTags: (_res, _err, arg) => {
                const tags: any[] = [
                    { type: "Tasklist", id: arg.listId },
                    "UserTaskStats",
                ];
                if (arg.householdId != null) {
                    tags.push({ type: "Activity", id: `HOUSEHOLD_${arg.householdId}` });
                }
                return tags;
            },
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

            async onQueryStarted({ listId }, { dispatch, queryFulfilled }) {
                // Safeguard against undefined
                if (listId == null) return;

                // Clear featuredTasklistId if it points at this list
                const patchSettings = dispatch(
                    featuredListSettingsSlice.util.updateQueryData(
                        "getFeaturedListSettings",
                        undefined,
                        (draft) => {
                            if (draft.featuredTasklist.tasklistId === listId) {
                                draft.featuredTasklist.tasklistId = null;
                            }
                        }
                    )
                );

                try {
                    await queryFulfilled;
                } catch {
                    patchSettings.undo();
                }
            },

            invalidatesTags: (_res, _err, { listId, householdId }) => [
                { type: "Tasklist", id: listId },
                { type: "Tasklist", id: "LIST" },
                "FeaturedListSettings",
                ...(householdId != null ? [{ type: "Activity" as const, id: `HOUSEHOLD_${householdId}` }] : []),
            ],
        }),

        updateTasklist: builder.mutation({
            query: ({ listId, data, householdId }) => ({
                url: `/tasklists/${listId}/settings`,
                method: "PUT",
                body: data
            }),

            // Now householdId will be available here!
            invalidatesTags: (_res, _err, { listId, householdId }): any[] => {
                const tags: any[] = [{ type: "Tasklist", id: listId }];
                tags.push("User" as any);
                if (householdId != null) {
                    tags.push({ type: "Tasklist", id: `HOUSEHOLD_${householdId}` });
                    tags.push({ type: "Activity", id: `HOUSEHOLD_${householdId}` });
                } else {
                    tags.push({ type: "Tasklist", id: "LIST" });
                }
                return tags;
            },
        }),

        updateTask: builder.mutation<
            Task,
            { taskId: number; listId: number; householdId?: number } & UpdateTaskPatch
        >({
            query: ({ taskId, ...patch }) => ({
                url: `/tasks/${taskId}`,
                method: "PATCH",
                body: {
                    ...patch,
                    dueDate: toDateOnlyString(patch.dueDate), // ✅ FIX
                },
            }),

            async onQueryStarted(
                { taskId, listId, householdId, ...patch },
                { dispatch, getState, queryFulfilled }
            ) {
                const normalizedPatch = {
                    ...patch,
                    dueDate: toDateOnlyString(patch.dueDate),
                };

                const p1 = dispatch(
                    taskSlice.util.updateQueryData("getTasklist", listId, (draft) => {
                        const task = draft?.tasks?.find((t) => t.id === taskId);
                        if (task) Object.assign(task, normalizedPatch);
                    })
                );

                try {
                    await queryFulfilled;
                } catch {
                    p1.undo();
                }
            },

            invalidatesTags: (_r, _e, { taskId, listId }) => [
                { type: "Tasklist", id: listId },
                { type: "Task", id: taskId },
                "UserTaskStats",
            ],
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

        reorderTasks: builder.mutation<void, ReorderPayload & { setToManual?: boolean }>({
            query: ({ listId, orderedIds, setToManual }) => ({
                url: `/tasklists/${listId}/reorder`,
                method: "PATCH",
                body: { orderedIds, setToManual },
            }),

            async onQueryStarted(
                { listId, orderedIds, householdId, setToManual },
                { dispatch, getState, queryFulfilled }
            ) {
                // 1) Patch the single list detail
                const p1 = dispatch(
                    taskSlice.util.updateQueryData(
                        "getTasklist",
                        listId,
                        (draft: TasklistType | undefined) => {
                            if (!draft?.tasks) return;

                            if (setToManual) {
                                draft.defaultSortOrder = "manual";
                            }

                            draft.tasks.sort(
                                (a, b) => orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id)
                            );
                            draft.tasks.forEach((t, i) => {
                                t.sortIndex = i;
                            });
                        }
                    )
                );

                // 2) Patch the household grid
                const p2 =
                    householdId != null
                        ? dispatch(
                            householdSlice.util.updateQueryData(
                                "getHouseholdTasklists",
                                householdId,
                                (lists: any[] | undefined) => {
                                    if (!lists) return;
                                    const target = lists.find((l) => l.id === listId);
                                    if (!target?.tasks) return;

                                    if (setToManual) {
                                        target.defaultSortOrder = "manual";
                                    }

                                    target.tasks.sort(
                                        (a: any, b: any) =>
                                            orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id)
                                    );
                                    target.tasks.forEach((t: any, i: number) => {
                                        t.sortIndex = i;
                                    });
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

            // ✅ FIX: invalidate the relevant tasklist/household caches so cards update
            invalidatesTags: (_res, _err, { listId, householdId }): TasklistTag[] => {
                const tags: TasklistTag[] = [{ type: "Tasklist", id: listId }];

                if (householdId != null) {
                    tags.push({ type: "Tasklist", id: `HOUSEHOLD_${householdId}` });
                }

                // Keep the list “bucket” fresh too, like in other mutations
                tags.push({ type: "Tasklist", id: "LIST" });

                return tags;
            },
        }),


        archiveList: builder.mutation<TasklistType, ArchiveListRequest>({
            query: ({ listId }) => ({
                url: `/tasklists/${listId}/archive`,
                method: "PUT",
            }),
            async onQueryStarted({ listId }, { dispatch, queryFulfilled }) {
                // Optimistic Update: Detailed view
                const patchDetail = dispatch(
                    taskSlice.util.updateQueryData("getTasklist", listId, (draft) => {
                        if (draft) draft.isArchived = true;
                    })
                );

                try {
                    await queryFulfilled;
                } catch {
                    patchDetail.undo();
                }
            },
            invalidatesTags: (result, _error, arg) => [
                { type: "Tasklist", id: arg.listId },
                { type: "Tasklist", id: "LIST" },
                ...(result?.householdId ? [
                    { type: "Tasklist", id: `HOUSEHOLD_${result.householdId}_ACTIVE` } as const,
                    { type: "Tasklist", id: `HOUSEHOLD_${result.householdId}_ARCHIVED` } as const,
                    { type: "Activity" as const, id: `HOUSEHOLD_${result.householdId}` },
                ] : []),
            ],
        }),

        /**
         * MUTATION: UNARCHIVE LIST
         */
        unarchiveList: builder.mutation<TasklistType, ArchiveListRequest>({
            query: ({ listId }) => ({
                url: `/tasklists/${listId}/unarchive`,
                method: "PUT",
            }),
            // ... onQueryStarted ...
            invalidatesTags: (result, _error, arg) => {
                const tags: any[] = [
                    { type: "Tasklist", id: arg.listId },
                    { type: "Tasklist", id: "LIST" },
                    "UserTaskStats",
                ];
                if (result?.householdId) {
                    tags.push(
                        { type: "Tasklist", id: `HOUSEHOLD_${result.householdId}` },
                        { type: "Tasklist", id: `HOUSEHOLD_${result.householdId}_ACTIVE` },
                        { type: "Tasklist", id: `HOUSEHOLD_${result.householdId}_ARCHIVED` },
                        { type: "Activity", id: `HOUSEHOLD_${result.householdId}` },
                    );
                }
                return tags;
            },
        }),

        duplicateList: builder.mutation<TasklistType, DuplicateListRequest>({
            query: ({ listId }) => ({
                url: `/tasklists/${listId}/duplicate`,
                method: "POST",
            }),
            // 3. Invalidate tags so the new list appears in the sidebar/dashboard
            invalidatesTags: (result) => {
                const tags: any[] = [{ type: "Tasklist", id: "LIST" }];
                if (result?.householdId) {
                    tags.push(
                        { type: "Tasklist", id: `HOUSEHOLD_${result.householdId}` },
                        { type: "Activity", id: `HOUSEHOLD_${result.householdId}` },
                    );
                }
                return tags;
            },
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
    useUnarchiveListMutation,
    useDuplicateListMutation
} = taskSlice;
