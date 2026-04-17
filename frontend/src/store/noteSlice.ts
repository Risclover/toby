import { apiSlice } from "./apiSlice";

export interface PersonalNote {
    id: string;
    userId: number;
    categoryId?: number;
    title: string | null;
    body: string;
    isPrivate: boolean;
    createdAt: string;
    updatedAt: string;
    category: {
        id: number;
        color: string;
        name: string;
    }
}

interface CreateNotePayload {
    title?: string;
    body: string;
    categoryId?: number;
    isPrivate: boolean;
}

interface UpdateNotePayload {
    id: string | undefined;
    title?: string;
    categoryId?: number;
    body: string;
    isPrivate: boolean;
}

export const noteApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getUserNotes: builder.query<PersonalNote[], number>({
            query: (userId) => `/users/${userId}/notes`,
            transformResponse: (res: { notes: PersonalNote[] }) => res.notes,
            providesTags: [{ type: "Note", id: "LIST" }],
        }),

        getNote: builder.query<PersonalNote, string>({
            query: (id) => `/personal-notes/${id}`,
            providesTags: (result, error, id) => [{ type: "Note", id }],
        }),

        getUserNote: builder.query<PersonalNote, { userId: number; noteId: string }>({
            query: ({ userId, noteId }) => `/users/${userId}/notes/${noteId}`,
            transformResponse: (res: { note: PersonalNote }) => res.note,
            providesTags: (result, error, { noteId }) => [{ type: "Note", id: noteId }],
        }),

        createNote: builder.mutation<PersonalNote, CreateNotePayload>({
            query: (body) => ({
                url: `/personal-notes/`,
                method: "POST",
                body,
            }),
            invalidatesTags: [{ type: "Note", id: "LIST" }],
        }),

        updateNote: builder.mutation<PersonalNote, UpdateNotePayload>({
            query: ({ id, ...body }) => ({
                url: `/personal-notes/${id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: "Note", id },
                { type: "Note", id: "LIST" },
            ],
        }),

        deleteNote: builder.mutation<{ message: string }, string>({
            query: (id) => ({
                url: `/personal-notes/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: [{ type: "Note", id: "LIST" }],
        }),
    }),
});

export const {
    useGetUserNotesQuery,
    useGetNoteQuery,
    useGetUserNoteQuery,
    useCreateNoteMutation,
    useUpdateNoteMutation,
    useDeleteNoteMutation,
} = noteApiSlice;