import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_BASE = import.meta.env?.VITE_BACKEND_URL ?? '/api';

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE,
    credentials: "include",
  }),
  tagTypes: ["Household", "TodoList", "Todo", "ShoppingList", "ShoppingItem", "Announcement", "ShoppingCategory", "Session", "User", "Mood", "Checkins", "Calendar"],
  endpoints: () => ({}),
});