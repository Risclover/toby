import { useAuthenticateQuery } from "@/store/authSlice"
import { useGetHouseholdShoppingListsQuery } from "@/store/householdSlice"
import { skipToken } from "@reduxjs/toolkit/query"
import { ShoppingList } from "./ShoppingList";
import "../styles/ShoppingLists.css"

export const ShoppingLists = () => {
    const { data: user, isFetching: authFetching } = useAuthenticateQuery();
    const householdId = user?.householdId;
    const { data: lists } = useGetHouseholdShoppingListsQuery(householdId ?? skipToken)

    return (
        <div className="shopping-lists-grid">
            {lists?.map((list) => <ShoppingList list={list} />)}
        </div>
    )
}