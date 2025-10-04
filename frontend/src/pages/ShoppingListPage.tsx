import { ShoppingList } from "@/features/Shopping/components/ShoppingList";
import { useStablePending } from "@/hooks/useStablePending";
import { useAuthenticateQuery } from "@/store/authSlice";
import { useGetHouseholdShoppingListQuery } from "@/store/householdSlice";
import { useAddShoppingItemMutation, useGetShoppingItemsQuery, useGetShoppingListQuery } from "@/store/shoppingSlice";
import { Button, TextInput } from "@mantine/core";
import { skipToken } from "@reduxjs/toolkit/query";
import { useState } from "react";
import { useParams } from "react-router-dom";

export const ShoppingListPage = () => {
    const [itemName, setItemName] = useState("");
    const { listId } = useParams();          // make sure your route param is named this!

    const { data: user } = useAuthenticateQuery();
    const householdId = user?.householdId;

    // fetch list header (title)
    const listArgs =
        householdId && Number.isFinite(listId)
            ? { householdId, listId }
            : (skipToken as any);
    const { data: list } = useGetHouseholdShoppingListQuery(listArgs);

    // fetch items
    const { data: items = [] } = useGetShoppingItemsQuery(
        Number(listId) ? listId : (skipToken as any)
    );

    const [addItem, { isLoading }] = useAddShoppingItemMutation();
    const loading = useStablePending(isLoading, { showAfterMs: 120, minVisibleMs: 300 });

    const handleAddItem = async () => {
        if (!Number(listId) || !itemName.trim()) return;
        await addItem({ listId, name: itemName.trim() }).unwrap(); // optimistic patch + server result
        setItemName("");
    };

    return (
        <div className="shopping-list-page">
            <h1>{list?.title}</h1>
            <TextInput value={itemName} onChange={(e) => setItemName(e.currentTarget.value)} placeholder="Item name" />
            <Button color="cyan" loading={loading} onClick={handleAddItem}>Add Item</Button>

            {/* Render items from the items query */}
            <div style={{ marginTop: 12 }}>
                {items.map((item) => <div key={item.id}>{item.name}</div>)}
            </div>
        </div>
    );
};