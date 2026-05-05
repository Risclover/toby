import { act } from "@testing-library/react";
import { useNotesFilter } from "../useNotesFilter";
import { renderHookWithStore } from "@/test-utils/renderWithStore";
import { makeNote } from "@/test-utils/factories";

describe("filtering", () => {
    beforeEach(() => {
        sessionStorage.clear();
    });

    it("returns only favorited notes when favoritism filter is active", () => {
        const notes = [
            makeNote({ id: "1", isFavorite: true }),
            makeNote({ id: "2", isFavorite: false }),
        ];

        const { result } = renderHookWithStore(() =>
            useNotesFilter(notes, true, 1)
        );

        act(() => {
            result.current.updateFilters({ favoritism: true });
        });

        expect(result.current.paginatedNotes).toHaveLength(1);
        expect(result.current.paginatedNotes[0].id).toBe("1");
    });

    it("returns only public notes when visibility filter is set to public", () => {
        const notes = [
            makeNote({ id: "1", isPrivate: true }),
            makeNote({ id: "2", isPrivate: false }),
        ];

        const { result } = renderHookWithStore(() => useNotesFilter(notes, true, 1));

        act(() => {
            result.current.updateFilters({ visibility: "public" });
        });

        expect(result.current.paginatedNotes).toHaveLength(1);
        expect(result.current.paginatedNotes[0].id).toBe("2");
    });

    it("returns only private notes when visibility filter is set to private", () => {
        const notes = [
            makeNote({ id: "1", isPrivate: true }),
            makeNote({ id: "2", isPrivate: false }),
        ];

        const { result } = renderHookWithStore(() => useNotesFilter(notes, true, 1));

        act(() => {
            result.current.updateFilters({ visibility: "private" });
        });

        expect(result.current.paginatedNotes).toHaveLength(1);
        expect(result.current.paginatedNotes[0].id).toBe("1");
    });

    it("returns public and private notes when visibility filter is set to all", () => {
        const notes = [
            makeNote({ id: "1", isPrivate: true }),
            makeNote({ id: "2", isPrivate: false }),
        ];

        const { result } = renderHookWithStore(() => useNotesFilter(notes, true, 1));

        act(() => {
            result.current.updateFilters({ visibility: "all" });
        });

        expect(result.current.paginatedNotes).toHaveLength(2);
    });

    it("hides private notes from non-owners", () => {
        const notes = [
            makeNote({ id: "1", isPrivate: true }),
            makeNote({ id: "2", isPrivate: false }),
        ];

        const { result } = renderHookWithStore(() =>
            useNotesFilter(notes, false, 1)
        );

        expect(result.current.paginatedNotes).toHaveLength(1);
        expect(result.current.paginatedNotes[0].id).toBe("2");
    });

    it("shows private notes to the owner", () => {
        const notes = [
            makeNote({ id: "1", isPrivate: true }),
            makeNote({ id: "2", isPrivate: false }),
        ];

        const { result } = renderHookWithStore(() =>
            useNotesFilter(notes, true, 1)
        );

        expect(result.current.paginatedNotes).toHaveLength(2);
    });

    it("returns only notes in a selected category when a single category is filtered", () => {
        const notes = [
            makeNote({ id: "1", categoryId: 1 }),
            makeNote({ id: "2", categoryId: 2 }),
            makeNote({ id: "3", categoryId: undefined }),
        ];

        const { result } = renderHookWithStore(() =>
            useNotesFilter(notes, true, 1)
        );

        act(() => {
            result.current.updateFilters({ categoryIds: [1] });
        });

        expect(result.current.paginatedNotes).toHaveLength(1);
        expect(result.current.paginatedNotes[0].id).toBe("1");
    });

    it("returns only notes in selected categories when multiple categories are filtered", () => {
        const notes = [
            makeNote({ id: "1", categoryId: 1 }),
            makeNote({ id: "2", categoryId: 2 }),
            makeNote({ id: "3", categoryId: 3 }),
            makeNote({ id: "4", categoryId: undefined }),
        ];

        const { result } = renderHookWithStore(() =>
            useNotesFilter(notes, true, 1)
        );

        act(() => {
            result.current.updateFilters({ categoryIds: [1, 3] });
        });

        expect(result.current.paginatedNotes).toHaveLength(2);
        expect(result.current.paginatedNotes.map(n => n.id)).toEqual(["1", "3"]);
    });

    it("returns all notes when no categories are filtered", () => {
        const notes = [
            makeNote({ id: "1", categoryId: 1 }),
            makeNote({ id: "2", categoryId: 2 }),
            makeNote({ id: "3", categoryId: undefined }),
        ];

        const { result } = renderHookWithStore(() =>
            useNotesFilter(notes, true, 1)
        );

        act(() => {
            result.current.updateFilters({ categoryIds: [] });
        });

        expect(result.current.paginatedNotes).toHaveLength(3);
    });

    it("returns notes that match both the favorites filter and category filter when both are active", () => {
        const notes = [
            makeNote({ id: "1", isFavorite: true, categoryId: 1 }),
            makeNote({ id: "2", isFavorite: true, categoryId: 2 }),
            makeNote({ id: "3", isFavorite: false, categoryId: 1 }),
            makeNote({ id: "4", isFavorite: false, categoryId: 2 }),
        ];

        const { result } = renderHookWithStore(() =>
            useNotesFilter(notes, true, 1)
        );

        act(() => {
            result.current.updateFilters({ favoritism: true, categoryIds: [1] });
        });

        expect(result.current.paginatedNotes).toHaveLength(1);
        expect(result.current.paginatedNotes[0].id).toBe("1");
    });
});

describe("searching", () => {
    beforeEach(() => {
        sessionStorage.clear();
    });

    it("returns notes when title matches query", async () => {
        const notes = [
            makeNote({ id: "1", title: "Shopping list" }),
            makeNote({ id: "2", title: "Work tasks" }),
        ];

        const { result } = renderHookWithStore(() =>
            useNotesFilter(notes, true, 1)
        );

        act(() => {
            result.current.setSearchInput("shopping");
        });

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 350));
        });

        expect(result.current.paginatedNotes).toHaveLength(1);
        expect(result.current.paginatedNotes[0].id).toBe("1");
    });

    it("returns notes when body matches query", async () => {
        const notes = [
            makeNote({ id: "1", body: "Shopping list" }),
            makeNote({ id: "2", body: "Work tasks" }),
        ];

        const { result } = renderHookWithStore(() =>
            useNotesFilter(notes, true, 1)
        );

        act(() => {
            result.current.setSearchInput("shopping");
        });

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 350));
        });

        expect(result.current.paginatedNotes).toHaveLength(1);
        expect(result.current.paginatedNotes[0].id).toBe("1");
    });

    it("doesn't return notes when title or body don't match query", async () => {
        const notes = [
            makeNote({ id: "1", title: "Shopping list" }),
            makeNote({ id: "2", title: "Work tasks" }),
        ];

        const { result } = renderHookWithStore(() =>
            useNotesFilter(notes, true, 1)
        );

        act(() => {
            result.current.setSearchInput("nonexistent");
        });

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 350));
        });

        expect(result.current.paginatedNotes).toHaveLength(0);
    });

    it("trims and lowercases search query", async () => {
        const notes = [
            makeNote({ id: "1", title: "Shopping list" }),
            makeNote({ id: "2", title: "Work tasks" }),
        ];

        const { result } = renderHookWithStore(() =>
            useNotesFilter(notes, true, 1)
        );

        act(() => {
            result.current.setSearchInput("  SHOPPING  ");
        });

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 350));
        });

        expect(result.current.paginatedNotes).toHaveLength(1);
        expect(result.current.paginatedNotes[0].id).toBe("1");
    });

    it("returns notes that match query in title or body", async () => {
        const notes = [
            makeNote({ id: "1", title: "Shopping list", body: "Remember to buy milk" }),
            makeNote({ id: "2", title: "Work tasks", body: "Finish report" }),
        ];

        const { result } = renderHookWithStore(() =>
            useNotesFilter(notes, true, 1)
        );

        act(() => {
            result.current.setSearchInput("milk");
        });

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 350));
        });

        expect(result.current.paginatedNotes).toHaveLength(1);
        expect(result.current.paginatedNotes[0].id).toBe("1");
    });

    it("returns all notes when search query is empty", async () => {
        const notes = [
            makeNote({ id: "1", title: "Shopping list" }),
            makeNote({ id: "2", title: "Work tasks" }),
        ];

        const { result } = renderHookWithStore(() =>
            useNotesFilter(notes, true, 1)
        );

        act(() => {
            result.current.setSearchInput("");
        });

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 350));
        });

        expect(result.current.paginatedNotes).toHaveLength(2);
    });
});

describe("sorting", () => {
    it("sorts by newest createdAt by default", () => {
        const notes = [
            makeNote({ id: "1", createdAt: "2024-01-01T00:00:00Z" }),
            makeNote({ id: "2", createdAt: "2024-02-01T00:00:00Z" }),
        ];

        const { result } = renderHookWithStore(() =>
            useNotesFilter(notes, true, 1)
        );

        expect(result.current.paginatedNotes[0].id).toBe("2");
        expect(result.current.paginatedNotes[1].id).toBe("1");
    })

    it("sorts by oldest createdAt when sort filter is set to oldest", () => {
        const notes = [
            makeNote({ id: "1", createdAt: "2024-01-01T00:00:00Z" }),
            makeNote({ id: "2", createdAt: "2024-02-01T00:00:00Z" }),
        ];

        const { result } = renderHookWithStore(() =>
            useNotesFilter(notes, true, 1)
        );

        act(() => {
            result.current.updateFilters({ sort: "oldest" });
        });

        expect(result.current.paginatedNotes[0].id).toBe("1");
        expect(result.current.paginatedNotes[1].id).toBe("2");
    });

    it("sorts alphabetically by title when sort filter is set to alpha", () => {
        const notes = [
            makeNote({ id: "1", title: "Banana" }),
            makeNote({ id: "2", title: "Apple" }),
        ];

        const { result } = renderHookWithStore(() =>
            useNotesFilter(notes, true, 1)
        );

        act(() => {
            result.current.updateFilters({ sort: "alpha" });
        });

        expect(result.current.paginatedNotes[0].id).toBe("2");
        expect(result.current.paginatedNotes[1].id).toBe("1");
    });

    it("sorts by category name alphabetically when sort filter is set to category_alpha", () => {
        const notes = [
            makeNote({ id: "1", title: "Note A", category: { id: 1, name: "Work", color: "red" } }),
            makeNote({ id: "2", title: "Note B", category: { id: 2, name: "Personal", color: "blue" } }),
            makeNote({ id: "3", title: "Note C", category: null }),
        ];

        const { result } = renderHookWithStore(() =>
            useNotesFilter(notes, true, 1)
        );

        act(() => {
            result.current.updateFilters({ sort: "category_alpha" });
        });

        expect(result.current.paginatedNotes[0].id).toBe("2");
        expect(result.current.paginatedNotes[1].id).toBe("1");
        expect(result.current.paginatedNotes[2].id).toBe("3");
    });

    it("sorts uncategorized notes last when sorting by category", () => {
        const notes = [
            makeNote({ id: "1", title: "Note A", category: { id: 1, name: "Work", color: "red" } }),
            makeNote({ id: "2", title: "Note B", category: null }),
            makeNote({ id: "3", title: "Note C", category: { id: 2, name: "Personal", color: "blue" } }),
        ];

        const { result } = renderHookWithStore(() =>
            useNotesFilter(notes, true, 1)
        );

        act(() => {
            result.current.updateFilters({ sort: "category_alpha" });
        });

        expect(result.current.paginatedNotes[0].id).toBe("3");
        expect(result.current.paginatedNotes[1].id).toBe("1");
        expect(result.current.paginatedNotes[2].id).toBe("2");
    });

    it("sorts private notes first when sort filter is set to private_first", () => {
        const notes = [
            makeNote({ id: "1", isPrivate: true, createdAt: "2024-01-01T00:00:00Z" }),
            makeNote({ id: "2", isPrivate: false, createdAt: "2024-02-01T00:00:00Z" }),
            makeNote({ id: "3", isPrivate: true, createdAt: "2024-03-01T00:00:00Z" }),
        ];

        const { result } = renderHookWithStore(() =>
            useNotesFilter(notes, true, 1)
        );

        act(() => {
            result.current.updateFilters({ sort: "private_first" });
        });

        expect(result.current.paginatedNotes[0].id).toBe("3");
        expect(result.current.paginatedNotes[1].id).toBe("1");
        expect(result.current.paginatedNotes[2].id).toBe("2");
    });

    it("tiebreaks by newest when sort filter is set to private_first", () => {
        const notes = [
            makeNote({ id: "1", isPrivate: true, createdAt: "2024-01-01T00:00:00Z" }),
            makeNote({ id: "2", isPrivate: true, createdAt: "2024-02-01T00:00:00Z" }),
            makeNote({ id: "3", isPrivate: false, createdAt: "2024-03-01T00:00:00Z" }),
        ];

        const { result } = renderHookWithStore(() =>
            useNotesFilter(notes, true, 1)
        );

        act(() => {
            result.current.updateFilters({ sort: "private_first" });
        });

        expect(result.current.paginatedNotes[0].id).toBe("2");
        expect(result.current.paginatedNotes[1].id).toBe("1");
        expect(result.current.paginatedNotes[2].id).toBe("3");
    })
})

describe("pagination", () => {
    beforeEach(() => {
        sessionStorage.clear();
    });

    it("shows 10 notes on first render", () => {
        const notes = Array.from({ length: 15 }, (_, i) =>
            makeNote({ id: String(i + 1) })
        );

        const { result } = renderHookWithStore(() =>
            useNotesFilter(notes, true, 1)
        );

        expect(result.current.paginatedNotes).toHaveLength(10);
    })

    it("increments by 10 with loadMore", () => {
        const notes = Array.from({ length: 25 }, (_, i) =>
            makeNote({ id: String(i + 1) })
        );

        const { result } = renderHookWithStore(() =>
            useNotesFilter(notes, true, 1)
        );

        act(() => {
            result.current.loadMore();
        });

        expect(result.current.paginatedNotes).toHaveLength(20);

        act(() => {
            result.current.loadMore();
        });

        expect(result.current.paginatedNotes).toHaveLength(25);
    })

    it("hasMore is false when all notes are visible", () => {
        const notes = Array.from({ length: 15 }, (_, i) =>
            makeNote({ id: String(i + 1) })
        );

        const { result } = renderHookWithStore(() =>
            useNotesFilter(notes, true, 1)
        );

        expect(result.current.hasMore).toBe(true);

        act(() => {
            result.current.loadMore();
        });

        expect(result.current.hasMore).toBe(false);
    })

    it("visibleCount resets to 10 when filters change", () => {
        const notes = [
            ...Array.from({ length: 20 }, (_, i) =>
                makeNote({ id: String(i + 1), isPrivate: false })
            ),
            ...Array.from({ length: 5 }, (_, i) =>
                makeNote({ id: String(i + 21), isPrivate: true })
            ),
        ];

        const { result } = renderHookWithStore(() =>
            useNotesFilter(notes, true, 1)
        );

        act(() => {
            result.current.loadMore();
        });

        expect(result.current.paginatedNotes).toHaveLength(20);

        act(() => {
            result.current.updateFilters({ visibility: "public" });
        });

        expect(result.current.paginatedNotes).toHaveLength(10);
    });

    it("visibleCount resets to 10 when search query changes", async () => {
        const notes = Array.from({ length: 25 }, (_, i) =>
            makeNote({ id: String(i + 1), title: `Note ${i + 1}` })
        );

        const { result } = renderHookWithStore(() =>
            useNotesFilter(notes, true, 1)
        );

        act(() => {
            result.current.loadMore();
        });

        expect(result.current.paginatedNotes).toHaveLength(20);

        act(() => {
            result.current.setSearchInput("Note 1");
        });

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 350));
        });

        expect(result.current.paginatedNotes).toHaveLength(10);
    });
})

describe("state management", () => {
    beforeEach(() => {
        sessionStorage.clear();
    });

    it("resetFilters returns all filters to defaults", () => {
        const { result } = renderHookWithStore(() =>
            useNotesFilter([], true, 1)
        );

        act(() => {
            result.current.updateFilters({
                favoritism: true,
                visibility: "private",
                categoryIds: [1, 2],
                sort: "alpha",
            });
        });

        act(() => {
            result.current.resetFilters();
        });

        expect(result.current.filters).toEqual({
            favoritism: false,
            visibility: "all",
            categoryIds: [],
            sort: "newest",
        });
    })

    it("persists filters in sessionStorage", () => {
        const { result } = renderHookWithStore(() =>
            useNotesFilter([], true, 1)
        );

        act(() => {
            result.current.updateFilters({
                favoritism: true,
                visibility: "private",
                categoryIds: [1, 2],
                sort: "alpha",
            });
        });

        const stored = sessionStorage.getItem("notes-filter-state-1");
        expect(stored).not.toBeNull();
        expect(JSON.parse(stored!)).toEqual({
            favoritism: true,
            visibility: "private",
            categoryIds: [1, 2],
            sort: "alpha",
        });
    });

    it("reloads filter state when navigating to a different user's notes page", () => {
        const { result, rerender } = renderHookWithStore(() =>
            useNotesFilter([], true, 1)
        );

        act(() => {
            result.current.updateFilters({
                favoritism: true,
                visibility: "private",
                categoryIds: [1, 2],
                sort: "alpha",
            });
        });

        rerender();

        expect(result.current.filters).toEqual({
            favoritism: true,
            visibility: "private",
            categoryIds: [1, 2],
            sort: "alpha",
        });
    });
})