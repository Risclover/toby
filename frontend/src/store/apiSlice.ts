import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_BASE = import.meta.env?.VITE_BACKEND_URL ?? '/api';
console.log('API_BASE in apiSlice:', API_BASE)

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE,
    credentials: "include",
  }),
  tagTypes: [
    "Activity", "Household", "Tasklist", "Task", "ShoppingList", "ShoppingItem",
    "Announcement", "ShoppingCategory", "Session", "User", "Mood",
    "Checkins", "Calendar", "UserTaskStats", "Reminders", "FeaturedListSettings", "Habit"
  ],
  endpoints: () => ({}),
});