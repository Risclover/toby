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
    "Checkin", "Calendar", "UserTaskStat", "Reminder", "FeaturedListSettings", "Habit", "UserSettings", "Auth", "Note", "NoteCategory",
    "UserStats", "ShoppingItemUnit", "FeaturedShoppingListSettings"
  ],
  endpoints: () => ({}),
});