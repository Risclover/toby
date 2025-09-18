import { apiSlice } from "./apiSlice";

export interface Todo {
    id: number;
    title: string;
    description?: string;
    status: "pending" | "in_progress" | "completed";
    priority: "low" | "normal" | "high";
    dueDate?: string;
    assignedToId?: number;
    list_id: number;
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
    dueDate?: string;
    assignedToId?: number | null;
    listId: number | undefined;
}

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
}

export const todoSlice = apiSlice.enhanceEndpoints({ addTagTypes: ["TodoList"] }).injectEndpoints({
    endpoints: (builder) => ({
        getTodoList: builder.query<TodoListType, number | undefined>({
            query: (todoListId) => `/todo_lists/${todoListId}`,
            providesTags: (result, error, todoListId) =>
                result ? [{ type: "TodoList", id: todoListId }] : [{ type: "TodoList", id: todoListId }],
        }),
        getTodoLists: builder.query<TodoListType[], void>({
            query: (householdId) => `/todo_lists/${householdId}`,
            transformResponse: (body: unknown) =>
                Array.isArray(body) ? body : [],
            providesTags: (result) =>
                result
                    ? [
                        ...result.map((list) => ({ type: "TodoList" as const, id: list.id })),
                        { type: "TodoList", id: "LIST" },
                    ]
                    : [{ type: "TodoList", id: "LIST" }],
        }),
        completeTodo: builder.mutation<Todo, CompleteTodoRequest>({
            query: ({ todoId }) => ({
                url: `/todos/${todoId}/completed`,
                method: "PUT",
                // no body needed
            }),
            invalidatesTags: (result, error, { listId }) => [
                { type: "TodoList", id: listId }
            ],
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
            invalidatesTags: (result, error, arg: CreateTodoRequest) => [{ type: "TodoList", id: arg.listId }],
        }),

        deleteTodo: builder.mutation<Todo, DeleteTodoRequest>({
            query: ({ listId, todoId }) => ({
                url: `/todo_lists/${listId}/todos/${todoId}`,
                method: "DELETE",
            }),
            invalidatesTags: (result, error, arg: DeleteTodoRequest) => [{ type: "TodoList", id: arg.listId }],
        }),

        clearList: builder.mutation<{ message: string }, ClearListRequest>({
            query: ({ listId }) => ({
                url: `/todo_lists/${listId}/todos`,
                method: "DELETE",
            }),
            invalidatesTags: (result, error, arg: ClearListRequest) => [{ type: "TodoList", id: arg.listId }],
        }),

        deleteList: builder.mutation<{ message: string }, DeleteListRequest>({
            query: ({ listId }) => ({
                url: `/todo_lists/${listId}`,
                method: "DELETE",
            }),
            invalidatesTags: (result, error, arg: DeleteListRequest) => [
                { type: "TodoList", id: arg.listId },
                { type: "TodoList", id: "LIST" },
            ],
        }),
    }),
});

export const {
    useGetTodoListQuery,
    useGetTodoListsQuery,
    useCreateHouseholdTodoListMutation,
    useAddTodoMutation,
    useDeleteTodoMutation,
    useClearListMutation,
    useDeleteListMutation,
    useCompleteTodoMutation
} = todoSlice;
