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
import { useLayoutEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ShoppingListBody } from "@/features/Shopping/components/ShoppingListPage/ShoppingListBody";
import { useAutoScrollOnAppend } from "@/hooks/useAutoScrollOnAppend";

export const ShoppingListPage = () => {
    const sectionsRef = useRef<HTMLDivElement>(null);
    const listEndRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const [itemName, setItemName] = useState("");
    const [showCompleted, setShowCompleted] = useState(false);
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

    return (
        <div className="household-tasklist-page">
            {/* Only pass list once it exists (narrowed to ShoppingList) */}
            {list ? <ShoppingListHeader list={list} /> : null}
            <div className="sections">
                {/* Also guard other components that require ShoppingList */}
                <ShoppingListBody ref={listEndRef}>
                    {uncompleted.length > 0 && list ?
                        uncompleted.map((listitem) => <ListItem key={listitem.id} listId={listIdNum} item={listitem} />)
                        :
                        null
                    }
                </ShoppingListBody>
                {completed.length > 0 ? <ShoppingListCompleted completed={completed} showCompleted={showCompleted} setShowCompleted={setShowCompleted} listId={listIdNum} /> : null}
            </div>
            <ShoppingListAddItem listId={listIdNum} />
        </div>
    );
};
