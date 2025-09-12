import { apiSlice } from "./apiSlice";

export interface Todo {
    id: number;
    title: string;
    description?: string;
    status: "pending" | "in_progress" | "completed";
    priority: "low" | "normal" | "high";
    due_date?: string;
    assigned_to_id?: number;
    list_id: number;
    created_at: string;
    updated_at: string;
}

export interface TodoList {
    id: number;
    title: string;
    user_id?: number;
    household_id?: number;
    todos?: Todo[];
    created_at: string;
    updated_at: string;
}

// Request types
export interface CreateTodoListRequest {
    title: string;
    userId?: number;
    householdId?: number;
}

export interface CreateTodoRequest {
    title: string;
    description?: string;
    status?: "pending" | "in_progress" | "completed";
    priority?: "low" | "normal" | "high";
    dueDate?: string;
    assignedToId?: number | null;
    listId: number;
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
        getTodoList: builder.query<TodoList, number>({
            query: (todoListId) => `/todo_lists/${todoListId}`,
            providesTags: (result, error, todoListId) =>
                result ? [{ type: "TodoList", id: todoListId }] : [{ type: "TodoList", id: todoListId }],
        }),
        getTodoLists: builder.query<TodoList[], void>({
            query: () => "/todo_lists",
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

        createTodoList: builder.mutation<TodoList, CreateTodoListRequest>({
            query: ({ title, userId, householdId }) => ({
                url: "/todo_lists",
                method: "POST",
                body: { title, user_id: userId, household_id: householdId },
            }),
            invalidatesTags: (result) =>
                result
                    ? [
                        { type: "TodoList", id: result.id },
                        { type: "TodoList", id: "LIST" },
                    ]
                    : [{ type: "TodoList", id: "LIST" }],
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
    useCreateTodoListMutation,
    useAddTodoMutation,
    useDeleteTodoMutation,
    useClearListMutation,
    useDeleteListMutation,
    useCompleteTodoMutation
} = todoSlice;
