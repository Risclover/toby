import type { ShoppingItem, ShoppingList } from "@/store"
import { ShoppingListItem } from "./ShoppingListItem"

type Props = {
    item: ShoppingItem;
    list: ShoppingList;
}
export const ShoppingListCompletedItem = ({ item, list }: Props) => {
    return (
        <div className={`completed-list-item`}>
            <div>
                <ShoppingListItem item={item} list={list} />
            </div>
        </div>
    )
}