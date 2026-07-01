import { useAuthenticateQuery } from "@/store/authSlice"
import { useGetHouseholdShoppingListsQuery } from "@/store/householdSlice"
import { skipToken } from "@reduxjs/toolkit/query"
import { ShoppingListCard } from "./ShoppingListCard";
import "../styles/ShoppingLists.css"
import { useGetShoppingListsQuery, type ShoppingList } from "@/store";

export const ShoppingLists = () => {
    const { data: user, isFetching: authFetching } = useAuthenticateQuery();
    const householdId = user?.householdId;
    const { data: lists } = useGetShoppingListsQuery(
        { householdId: Number(user?.householdId), isArchived: false },
        { skip: !user?.householdId }
    );


    return (
        <div className="shopping-lists-grid">
            {lists?.map((list: ShoppingList) => !list.isArchived && <ShoppingListCard list={list} />)}
        </div>
    )
}