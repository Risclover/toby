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

export const ShoppingListPage = () => {
    const sectionsRef = useRef<HTMLDivElement>(null);
    const listEndRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const [itemName, setItemName] = useState("");
    const [showCompleted, setShowCompleted] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>("flat");

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

    // Group uncompleted by category ONLY when viewMode === "category"
    const grouped = useMemo(() => {
        if (viewMode !== "category") return [];
        const UNCATEGORIZED_ID = -1;
        const UNCATEGORIZED = { id: UNCATEGORIZED_ID, name: "Uncategorized", aisleOrder: Number.MAX_SAFE_INTEGER };

        // Map<categoryId, { category, items[] }>
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
        // Sort groups by aisleOrder then name for stable UX
        arr.sort((a, b) => {
            const ao = a.category.aisleOrder ?? Number.MAX_SAFE_INTEGER;
            const bo = b.category.aisleOrder ?? Number.MAX_SAFE_INTEGER;
            if (ao !== bo) return ao - bo;
            return a.category.name.localeCompare(b.category.name);
        });
        // Optional: sort items within a group (name asc)
        for (const g of arr) g.items.sort((x, y) => x.name.localeCompare(y.name));

        return arr;
    }, [uncompleted, viewMode, categoriesById]);

    return (
        <div className="shopping-list-page">
            {/* Only pass list once it exists (narrowed to ShoppingList) */}
            {list ? (
                <ShoppingListHeader
                    list={list}
                    viewMode={viewMode}
                    onChangeViewMode={setViewMode}
                />
            ) : null}
            <div className="sections">
                <ShoppingListBody ref={listEndRef}>
                    {viewMode === "flat" ? (
                        // --- FLAT (your current rendering) ---
                        <ul className="tasklist">
                            {uncompleted.length > 0 && list
                                ? uncompleted.map((listitem) => (
                                    <ListItem key={listitem.id} listId={listIdNum} item={listitem} uncompleted />
                                ))
                                : null}
                            <li ref={listEndRef} aria-hidden />
                        </ul>
                    ) : (
                        // --- BY CATEGORY (grouped) ---
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
