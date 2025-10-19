import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}`,
    credentials: "include",
  }),
  tagTypes: ["Household", "TodoList", "Todo", "ShoppingList", "ShoppingItem", "Announcement", "ShoppingCategory", "Session", "User", "Mood", "Checkins", "Calendar"],
  endpoints: () => ({}),
});