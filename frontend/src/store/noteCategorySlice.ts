import { apiSlice } from "./apiSlice";

export interface PersonalNoteCategory {
    id: number;
    userId: number;
    name: string;
    color?: string;
}

interface CreateCategoryPayload {
    name: string;
    color?: string;
}

interface UpdateCategoryPayload {
    id: number;
    name: string;
    color?: string;
}

interface UpdateNoteCategoryPayload {
    id: string;       // note ID
    categoryId: number | null;
}

export const noteCategoryApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getCategories: builder.query<PersonalNoteCategory[], void>({
            query: () => `/personal-note-categories/`,
            providesTags: [{ type: "NoteCategory", id: "LIST" }]
        }),

        getCategory: builder.query<PersonalNoteCategory, number>({
            query: (categoryId) => `/personal-note-categories/${categoryId}`,
            providesTags: (result, error, id) => [{ type: "NoteCategory", id }]
        }),

        createNoteCategory: builder.mutation<PersonalNoteCategory, CreateCategoryPayload>({
            query: (body) => ({
                url: `/personal-note-categories`,
                method: "POST",
                body,
            }),
            invalidatesTags: (result, error, id) => [{ type: "NoteCategory", id: "LIST" }]
        }),

        updateCategory: builder.mutation<PersonalNoteCategory, UpdateCategoryPayload>({
            query: ({ id, ...body }) => ({
                url: `/personal-note-categories/${id}`,
                method: "PUT",
                body
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: "NoteCategory", id },
                { type: "NoteCategory", id: "LIST" }
            ]
        }),

        updateNoteCategory: builder.mutation<PersonalNoteCategory, UpdateNoteCategoryPayload>({
            query: ({ id, ...body }) => ({
                url: `/personal-notes/${id}/category`,
                method: "PATCH",
                body
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: "Note", id },
                { type: "NoteCategory", id: "LIST" }
            ]
        }),

        deleteNoteCategory: builder.mutation<{ message: string }, number>({
            query: (id) => ({
                url: `/personal-note-categories/${id}`,
                method: "DELETE"
            }),
            invalidatesTags: [{ type: "NoteCategory", id: "LIST" }]
        }),

        getUserNoteCategories: builder.query<PersonalNoteCategory[], number>({
            query: (userId) => `/users/${userId}/note-categories`,
            transformResponse: (res: PersonalNoteCategory[]) => res,
            providesTags: [{ type: "NoteCategory", id: "LIST" }],
        }),
    })
})

export const {
    useGetCategoriesQuery,
    useCreateNoteCategoryMutation,
    useDeleteNoteCategoryMutation,
    useGetCategoryQuery,
    useUpdateCategoryMutation,
    useUpdateNoteCategoryMutation,
    useGetUserNoteCategoriesQuery
} = noteCategoryApiSlice