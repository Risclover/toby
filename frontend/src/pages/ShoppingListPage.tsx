import { ShoppingListHeader } from "@/features/Shopping/components/ShoppingListHeader";
import { ShoppingListTitleComponent } from "@/features/Shopping/components/ShoppingListTitleComponent";
import { MobileLayout } from "@/layout";
import { useGetShoppingListQuery, type ShoppingList } from "@/store"
import { useParams } from "react-router-dom";


export const ShoppingListPage = () => {
    const { listId } = useParams();
    const { data: list } = useGetShoppingListQuery(Number(listId))

    if (!list) return null;
    return (
        <MobileLayout titleComponent={<ShoppingListTitleComponent list={list} />}>
            <ShoppingListHeader />
        </MobileLayout>
    )
}