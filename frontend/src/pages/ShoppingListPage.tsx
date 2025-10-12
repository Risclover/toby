import { ShoppingListHeader } from "@/features/Shopping/components/ShoppingListPage/ShoppingListHeader";
import { ListItem } from "@/features/Shopping/components/ShoppingListPage/ListItem";
import { ShoppingListAddItem } from "@/features/Shopping/components/ShoppingListPage/ShoppingListAddItem";
import { ShoppingListCompleted } from "@/features/Shopping/components/ShoppingListPage/ShoppingListCompleted";
import { useStablePending } from "@/hooks/useStablePending";
import { useAuthenticateQuery } from "@/store/authSlice";
import { useGetHouseholdShoppingListQuery } from "@/store/householdSlice";
import {
    useAddShoppingItemMutation,
    useEditShoppingListMutation,
    useGetShoppingItemsQuery,
} from "@/store/shoppingSlice";
import { skipToken } from "@reduxjs/toolkit/query";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ShoppingListBody } from "@/features/Shopping/components/ShoppingListPage/ShoppingListBody";
import { useAutoScrollOnAppend } from "@/hooks/useAutoScrollOnAppend";

type ViewMode = "flat" | "category";
type SortMode =
    | "name-asc" | "name-desc"
    | "qty-asc" | "qty-desc"
    | "cat-asc" | "cat-desc";

export const ShoppingListPage = () => {
    const sectionsRef = useRef<HTMLDivElement>(null);
    const listEndRef = useRef<HTMLLIElement>(null);
    const navigate = useNavigate();

    const [itemName, setItemName] = useState("");
    const [showCompleted, setShowCompleted] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>("flat");
    const [sortMode, setSortMode] = useState<SortMode | null>(null); // null = default order

    // Route param is string; coerce once to number
    const { listId: listIdParam } = useParams<{ listId: string }>();
    const listIdNum = listIdParam ? Number(listIdParam) : NaN;
    const hasValidListId = Number.isFinite(listIdNum);

    const [updateShoppingList] = useEditShoppingListMutation();
    const { data: user } = useAuthenticateQuery();
    const householdId = user?.householdId;

    // ----- Queries -----

    // List metadata (header)
    const listArgs =
        householdId && hasValidListId
            ? { householdId, listId: listIdNum }
            : (skipToken as any);

    const { data: list } = useGetHouseholdShoppingListQuery(listArgs);
    // list is ShoppingList | undefined while loading

    // Items
    const itemsArg = hasValidListId ? listIdNum : (skipToken as any);
    const { data: items = [] } = useGetShoppingItemsQuery(itemsArg);

    const [addItem, { isLoading }] = useAddShoppingItemMutation();
    const loading = useStablePending(isLoading, { showAfterMs: 120, minVisibleMs: 300 });

    // ----- Derived -----
    const completed = items.filter((i) => i.purchased === true);
    const uncompleted = items.filter((i) => i.purchased === false);

    useAutoScrollOnAppend(sectionsRef, items.length, { behavior: "smooth" });

    const prevUncompleted = useRef<number | null>(null);
    useLayoutEffect(() => {
        // initialize; don't scroll on first fetch
        if (prevUncompleted.current === null) {
            prevUncompleted.current = uncompleted.length;
            return;
        }

        const appended = uncompleted.length > prevUncompleted.current;
        const isFirstAppend = prevUncompleted.current === 0; // 0 → N
        prevUncompleted.current = uncompleted.length;

        if (!appended || isFirstAppend) return;

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                listEndRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "end",
                    inline: "nearest",
                });
            });
        });
    }, [uncompleted.length]);

    const categoriesById = useMemo(() => {
        const m = new Map<number, { id: number; name: string; aisleOrder?: number }>();
        (list?.categories ?? []).forEach((c: any) => m.set(c.id, c));
        return m;
    }, [list]);

    // Helpers for sorting safely
    const normalizeStr = (s: unknown) => String(s ?? "").trim().toLowerCase();
    const getQty = (it: any) => {
        const q = (it.quantity ?? it.qty ?? 1);
        const n = typeof q === "string" ? Number(q) : q;
        return Number.isFinite(n) ? (n as number) : 1;
    };
    const getItemCategoryName = (it: any) => {
        const id = typeof it.categoryId === "number" ? it.categoryId : undefined;
        return id != null ? (categoriesById.get(id)?.name ?? "Uncategorized") : "Uncategorized";
    };

    // --- Flat sorted list (only sort when sortMode is set) ---
    const sortedUncompletedFlat = useMemo(() => {
        if (sortMode === null) return uncompleted.slice(); // default/original order

        const arr = uncompleted.slice();
        const byNameAsc = (a: any, b: any) => normalizeStr(a.name).localeCompare(normalizeStr(b.name));
        const byNameDesc = (a: any, b: any) => -byNameAsc(a, b);
        const byQtyAsc = (a: any, b: any) => (getQty(a) - getQty(b)) || byNameAsc(a, b);
        const byQtyDesc = (a: any, b: any) => (getQty(b) - getQty(a)) || byNameAsc(a, b);
        const byCatAsc = (a: any, b: any) => {
            const d = normalizeStr(getItemCategoryName(a)).localeCompare(normalizeStr(getItemCategoryName(b)));
            return d || byNameAsc(a, b);
        };
        const byCatDesc = (a: any, b: any) => -byCatAsc(a, b);

        switch (sortMode) {
            case "name-asc": arr.sort(byNameAsc); break;
            case "name-desc": arr.sort(byNameDesc); break;
            case "qty-asc": arr.sort(byQtyAsc); break;
            case "qty-desc": arr.sort(byQtyDesc); break;
            case "cat-asc": arr.sort(byCatAsc); break;
            case "cat-desc": arr.sort(byCatDesc); break;
        }
        return arr;
    }, [uncompleted, sortMode, categoriesById]);

    // --- Grouped view (respect default group order when sortMode is null) ---
    const grouped = useMemo(() => {
        if (viewMode !== "category") return [];

        const UNCATEGORIZED_ID = -1;
        const UNCATEGORIZED = { id: UNCATEGORIZED_ID, name: "Uncategorized", aisleOrder: Number.MAX_SAFE_INTEGER };

        const map = new Map<number, { category: { id: number; name: string; aisleOrder?: number }, items: typeof uncompleted }>();
        const ensure = (cid: number) => {
            if (!map.has(cid)) {
                const cat = cid === UNCATEGORIZED_ID ? UNCATEGORIZED : (categoriesById.get(cid) ?? UNCATEGORIZED);
                map.set(cid, { category: cat, items: [] as typeof uncompleted });
            }
            return map.get(cid)!;
        };
        for (const it of uncompleted) {
            const cid = typeof it.categoryId === "number" ? it.categoryId : UNCATEGORIZED_ID;
            ensure(cid).items.push(it);
        }

        const arr = Array.from(map.values());

        // Group ordering:
        if (sortMode === "cat-asc" || sortMode === "cat-desc") {
            const byCatNameAsc = (a: any, b: any) => normalizeStr(a.category.name).localeCompare(normalizeStr(b.category.name));
            arr.sort(sortMode === "cat-asc" ? byCatNameAsc : (a, b) => -byCatNameAsc(a, b));
        } else if (sortMode === null) {
            // Default/original: aisleOrder, then name (your previous behavior)
            arr.sort((a, b) => {
                const ao = a.category.aisleOrder ?? Number.MAX_SAFE_INTEGER;
                const bo = b.category.aisleOrder ?? Number.MAX_SAFE_INTEGER;
                if (ao !== bo) return ao - bo;
                return a.category.name.localeCompare(b.category.name);
            });
        } else {
            // If sorting by name/qty, keep default group order
            arr.sort((a, b) => {
                const ao = a.category.aisleOrder ?? Number.MAX_SAFE_INTEGER;
                const bo = b.category.aisleOrder ?? Number.MAX_SAFE_INTEGER;
                if (ao !== bo) return ao - bo;
                return a.category.name.localeCompare(b.category.name);
            });
        }

        // Item ordering inside each group:
        if (sortMode === null) {
            // Keep original item order (no sorting)
            return arr;
        }
        const byNameAsc = (a: any, b: any) => normalizeStr(a.name).localeCompare(normalizeStr(b.name));
        const byNameDesc = (a: any, b: any) => -byNameAsc(a, b);
        const byQtyAsc = (a: any, b: any) => (getQty(a) - getQty(b)) || byNameAsc(a, b);
        const byQtyDesc = (a: any, b: any) => (getQty(b) - getQty(a)) || byNameAsc(a, b);
        for (const g of arr) {
            switch (sortMode) {
                case "name-asc": g.items.sort(byNameAsc); break;
                case "name-desc": g.items.sort(byNameDesc); break;
                case "qty-asc": g.items.sort(byQtyAsc); break;
                case "qty-desc": g.items.sort(byQtyDesc); break;
                case "cat-asc":
                case "cat-desc":
                    g.items.sort(byNameAsc);                  // alphabetize within each cat
                    break;
            }
        }
        return arr;
    }, [uncompleted, viewMode, sortMode, categoriesById]);

    return (
        <div className="shopping-list-page">
            {list ? (
                <ShoppingListHeader
                    list={list}
                    viewMode={viewMode}
                    onChangeViewMode={setViewMode}
                    sortMode={sortMode}                      // <-- NEW
                    onChangeSortMode={setSortMode}           // <-- NEW
                />
            ) : null}

            <div className="sections">
                <ShoppingListBody>
                    {viewMode === "flat" ? (
                        <ul className="tasklist">
                            {sortedUncompletedFlat.length > 0 && list
                                ? sortedUncompletedFlat.map((listitem) => (
                                    <ListItem key={listitem.id} listId={listIdNum} item={listitem} uncompleted />
                                ))
                                : null}
                            <li ref={listEndRef} aria-hidden />
                        </ul>
                    ) : (
                        <>
                            {grouped.map(({ category, items: catItems }) => (
                                <section key={category.id} className="category-section">
                                    <header className="category-header">
                                        <h3>{category.name}</h3>
                                    </header>
                                    <ul className="tasklist">
                                        {catItems.map((listitem) => (
                                            <ListItem key={listitem.id} listId={listIdNum} item={listitem} uncompleted />
                                        ))}
                                    </ul>
                                </section>
                            ))}
                        </>
                    )}
                </ShoppingListBody>

                {/* completed unchanged */}
                {completed.length > 0 ? (
                    <ShoppingListCompleted
                        completed={completed}
                        showCompleted={showCompleted}
                        setShowCompleted={setShowCompleted}
                        listId={listIdNum}
                    />
                ) : null}
            </div>

            <ShoppingListAddItem listId={listIdNum} />
        </div>
    );
};
