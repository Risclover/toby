import type { PersonalNote } from "@/store/noteSlice";

export const makeNote = (overrides?: Partial<PersonalNote>): PersonalNote => ({
    id: "1",
    userId: 1,
    title: "Test note",
    body: "<p>Default body</p>",
    isPrivate: false,
    isFavorite: false,
    categoryId: undefined,
    category: null,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    ...overrides,
});