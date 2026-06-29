import { HomepageCollapseCard } from "@/components/HomepageCollapseCard/HomepageCollapseCard"
import type { ShoppingItem, ShoppingList } from "@/store"
import { ShoppingListCompletedItem } from "./ShoppingListCompletedItem";

type Props = {
    list: ShoppingList;
    completed: ShoppingItem[];
}
export const ShoppingListCompleted = ({ list, completed }: Props) => {
    return (
        <HomepageCollapseCard title="completed" color={list.color} cardKey={`shopping-list-completed-${list.id}`}>
            <div className="panel-body">
                {completed.map((item) => {
                    return (
                        <ShoppingListCompletedItem key={item.id} list={list} item={item} />
                    )
                })}
            </div>
        </HomepageCollapseCard>
    )
}