import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_BASE = import.meta.env?.VITE_BACKEND_URL ?? '/api';

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE,
    credentials: "include",
  }),
  tagTypes: [
    "Household", "Tasklist", "Task", "ShoppingList", "ShoppingItem",
    "Announcement", "ShoppingCategory", "Session", "User", "Mood",
    "Checkins", "Calendar", "UserTaskStats"
  ],
  endpoints: () => ({}),
});