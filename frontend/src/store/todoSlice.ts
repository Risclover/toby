import { apiSlice } from "./apiSlice";
import { householdSlice } from "./householdSlice"; // 👈 add this import

export interface Todo {
    id: number;
    title: string;
    description?: string;
    status: "pending" | "in_progress" | "completed";
    priority: "low" | "normal" | "high";
    sortIndex: number;
    dueDate?: string | Date | undefined | null;
    assignedToId?: number | undefined | null;
    listId: number;
    notes: string | undefined;
    createdAt: string;   // <- camelCase
    updatedAt: string;
}

export interface TodoListType {
    id: number;
    title: string;
    userId?: number;
    householdId?: number;
    memberIds?: number[];
    todos?: Todo[];
    createdAt: string;   // <- camelCase
    updatedAt?: string;
}

type CreateTodoListBase = {
    title: string;
}

type CreateForUser = CreateTodoListBase & {
    userId: number;
    householdId?: never;
    allMembers?: never;
    memberIds?: never;
}

type CreateForHousehold = CreateTodoListBase & {
    householdId: number;
    allMembers: true;          // literal true
    memberIds?: never;         // must be absent
    userId?: never;
}

type CreateForHouseholdSubset = CreateTodoListBase & {
    householdId: number;
    allMembers: false;         // literal false
    memberIds: number[];       // required now
    userId?: never;
};

// Request types
export type CreateTodoListRequest = CreateForUser | CreateForHousehold | CreateForHouseholdSubset

export interface CreateTodoRequest {
    title: string;
    description?: string;
    status?: "pending" | "in_progress" | "completed";
    priority?: "low" | "normal" | "high";
    dueDate?: string | Date | undefined;
    assignedToId?: number | undefined | null;
    listId: number | undefined;
}

export type ReorderPayload = {
    listId: number;
    orderedIds: number[];
    householdId?: number; // pass when you have it; we’ll try to derive if not
};

export interface DeleteTodoRequest {
    listId: number;
    todoId: number;
}

export interface ClearListRequest {
    listId: number;
}

export interface DeleteListRequest {
    listId: number;
}

export interface CompleteTodoRequest {
    todoId: number;
    listId: number;
    completed: boolean;
    householdId?: number;
}

type UpdateTodoPatch = Partial<
    Pick<Todo, "priority" | "status" | "title" | "description" | "dueDate" | "assignedToId" | "notes">
>;

type TodoListTag = { type: "TodoList"; id: number | string };

export const todoSlice = apiSlice.enhanceEndpoints({ addTagTypes: ["TodoList", "Todo"] }).injectEndpoints({
    endpoints: (builder) => ({
        getTodo: builder.query({
            query: (todoId) => `/todos/${todoId}`,
            providesTags: (_res, _err, todoId) => [{ type: "Todo", id: todoId }]
        }),
        getTodoList: builder.query<TodoListType, number | undefined>({
            query: (todoListId) => `/todo_lists/${todoListId}`,
            providesTags: (_res, _err, todoListId): TodoListTag[] => {
                return [
                    { type: "TodoList", id: todoListId ?? "LIST" }, // string | number
                ]
            }
        }),

        getTodoLists: builder.query<TodoListType[], number>({
            query: (householdId) => `/todo_lists/${householdId}`,
            providesTags: (result, _error, householdId): TodoListTag[] =>
                result?.length
                    ? [
                        ...result.map((l) => ({ type: "TodoList", id: l.id } as TodoListTag)),
                        { type: "TodoList", id: `HOUSEHOLD_${householdId}` }, // string tag ok
                        { type: "TodoList", id: "LIST" },
                    ]
                    : [
                        { type: "TodoList", id: `HOUSEHOLD_${householdId}` },
                        { type: "TodoList", id: "LIST" },
                    ],
        }),

        completeTodo: builder.mutation<Todo, CompleteTodoRequest>({
            query: ({ todoId, completed }) => ({
                url: `/todos/${todoId}/completed`,
                method: "PUT",
                body: { completed },
            }),
            invalidatesTags: (_res, _err, { listId, householdId }): TodoListTag[] => {
                const tags: TodoListTag[] = [{ type: "TodoList", id: listId }];
                if (householdId != null) tags.push({ type: "TodoList", id: `HOUSEHOLD_${householdId}` });
                // keep the list “bucket” fresh too
                tags.push({ type: "TodoList", id: "LIST" });
                return tags;
            },
        }),

        createHouseholdTodoList: builder.mutation<TodoListType, CreateTodoListRequest>({
            query: (arg) => {
                // user-owned
                if ("userId" in arg) {
                    const { title, userId } = arg;
                    return {
                        url: "todo_lists",
                        method: "POST",
                        body: { title, user_id: userId },
                    };
                }

                // household-owned
                const { title, householdId, allMembers } = arg;
                return {
                    url: `households/${householdId}/todo_lists`,
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
                        { type: "TodoList", id: result.id },
                        result.householdId
                            ? { type: "TodoList", id: `HOUSEHOLD_${result.householdId}` }
                            : { type: "TodoList", id: `USER_${result.userId}` },
                    ]
                    : [],
        }),

        addTodo: builder.mutation<Todo, CreateTodoRequest>({
            query: ({ title, description, status, priority, dueDate, assignedToId, listId }) => ({
                url: `/todo_lists/${listId}/todos`,
                method: "POST",
                body: {
                    title,
                    description,
                    status,
                    priority,
                    due_date: dueDate,
                    assigned_to_id: assignedToId,
                    list_id: listId,
                },
            }),
            invalidatesTags: (_res, _err, arg: CreateTodoRequest) => {
                return [{ type: "TodoList", id: arg.listId }]
            }
        }),

        deleteTodo: builder.mutation<Todo, DeleteTodoRequest>({
            query: ({ listId, todoId }) => ({
                url: `/todo_lists/${listId}/todos/${todoId}`,
                method: "DELETE",
            }),
            invalidatesTags: (_res, _err, arg: DeleteTodoRequest) => {
                return [{ type: "TodoList", id: arg.listId }]
            }
        }),

        clearList: builder.mutation<{ message: string }, ClearListRequest>({
            query: ({ listId }) => ({
                url: `/todo_lists/${listId}/todos`,
                method: "DELETE",
            }),
            invalidatesTags: (_res, _err, arg: ClearListRequest) => {
                return [{ type: "TodoList", id: arg.listId }]
            }
        }),

        deleteList: builder.mutation<{ message: string }, DeleteListRequest>({
            query: ({ listId }) => ({
                url: `/todo_lists/${listId}`,
                method: "DELETE",
            }),
            invalidatesTags: (_res, _err, arg: DeleteListRequest) => {
                return [{ type: "TodoList", id: arg.listId }, { type: "TodoList", id: "LIST" }]
            }
        }),

        updateTodoList: builder.mutation({
            query: ({ listId, title }) => ({
                url: `/todo_lists/${listId}`,
                method: "PUT",
                body: { title }
            }),
            invalidatesTags: (_res, _err, { listId, householdId }): TodoListTag[] => {
                const tags: TodoListTag[] = [{ type: "TodoList", id: listId }];
                if (householdId != null) tags.push({ type: "TodoList", id: `HOUSEHOLD_${householdId}` });
                tags.push({ type: "TodoList", id: listId })
                tags.push({ type: "TodoList", id: "LIST" });
                return tags;
            },
        }),

        updateTodo: builder.mutation<
            Todo,
            { todoId: number; listId: number; householdId?: number } & UpdateTodoPatch
        >({
            query: ({ todoId, listId, householdId, ...patch }) => ({
                url: `/todos/${todoId}`,
                method: "PATCH",                 // <-- partial update
                body: patch,                     // <-- only what you pass in
            }),
            async onQueryStarted({ todoId, listId, householdId, ...patch }, { dispatch, getState, queryFulfilled }) {
                const p1 = dispatch(
                    todoSlice.util.updateQueryData("getTodoList", listId, (draft) => {
                        const todo = draft?.todos?.find(x => x.id === todoId);
                        if (todo) {
                            Object.entries(patch).forEach(([key, value]) => { if (value !== undefined) (todo as any)[key] = value; });
                            (todo as any).updatedAt = new Date().toISOString();
                        }
                    })
                );

                if (householdId == null) {
                    const sel = todoSlice.endpoints.getTodoList.select(listId)(getState() as any);
                    householdId = sel?.data?.householdId ?? undefined;
                }

                const p2 = householdId != null
                    ? dispatch(
                        householdSlice.util.updateQueryData("getHouseholdTodoLists", householdId, (lists: any[] | undefined) => {
                            const list = lists?.find(l => l.id === listId);
                            const todo = list?.todos?.find((x: any) => x.id === todoId);
                            if (todo) {
                                Object.entries(patch).forEach(([key, value]) => { if (value !== undefined) (todo as any)[key] = value; });
                                todo.updatedAt = new Date().toISOString();
                            }
                        })
                    )
                    : { undo: () => { } };

                const pSingle = dispatch(
                    todoSlice.util.updateQueryData("getTodo", todoId, (draft: any) => {
                        if (draft) Object.assign(draft, patch, { updatedAt: new Date().toISOString() });
                    })
                );
                try { await queryFulfilled; } catch { p1.undo(); p2.undo?.(); pSingle.undo(); }
            },
            invalidatesTags: (_r, _e, { todoId, listId, householdId }) => {
                const tags: any[] = [
                    { type: "TodoList", id: listId },
                    { type: "TodoList", id: "LIST" },
                    { type: "Todo", id: todoId }, // ✅ refetch single-todo queries
                ];
                if (householdId != null) tags.push({ type: "TodoList", id: `HOUSEHOLD_${householdId}` });
                return tags;
            },
        }),

        reorderTodos: builder.mutation<void, ReorderPayload>({
            query: ({ listId, orderedIds }) => ({
                url: `/todo_lists/${listId}/reorder`,
                method: "PATCH",
                body: { orderedIds },
            }),
            async onQueryStarted({ listId, orderedIds, householdId }, { dispatch, getState, queryFulfilled }) {
                // 1) Patch the single list detail
                const p1 = dispatch(
                    todoSlice.util.updateQueryData("getTodoList", listId, (draft: TodoListType | undefined) => {
                        if (!draft?.todos) return;
                        draft.todos.sort((a, b) => orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id));
                        draft.todos.forEach((t, i) => (t.sortIndex = i));
                    })
                );

                // Infer householdId if missing
                if (householdId == null) {
                    const sel = todoSlice.endpoints.getTodoList.select(listId)(getState() as any);
                    householdId = sel?.data?.householdId ?? undefined;
                }

                // 2) Patch the household grid (endpoint lives on householdSlice)
                const p2 =
                    householdId != null
                        ? dispatch(
                            householdSlice.util.updateQueryData(
                                "getHouseholdTodoLists",
                                householdId, // must match useGetHouseholdTodoListsQuery arg
                                (lists: any[] | undefined) => {
                                    if (!lists) return;
                                    const target = lists.find((l) => l.id === listId);
                                    if (!target?.todos) return;
                                    target.todos.sort((a: any, b: any) => orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id));
                                    target.todos.forEach((t: any, i: number) => (t.sortIndex = i));
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
        })

    })
})

export const {
    useGetTodoQuery,
    useGetTodoListQuery,
    useGetTodoListsQuery,
    useCreateHouseholdTodoListMutation,
    useAddTodoMutation,
    useDeleteTodoMutation,
    useClearListMutation,
    useDeleteListMutation,
    useCompleteTodoMutation,
    useUpdateTodoListMutation,
    useUpdateTodoMutation,
    useReorderTodosMutation
} = todoSlice;
