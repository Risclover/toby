import { HomepageCollapseCard } from "@/components/HomepageCollapseCard/HomepageCollapseCard"
import type { ShoppingItem, ShoppingList } from "@/store"
import { ShoppingListCompletedItem } from "./ShoppingListCompletedItem";

type Props = {
    list: ShoppingList;
    completed: ShoppingItem[];
    noTopMargin?: boolean;
}
export const ShoppingListCompleted = ({ list, completed, noTopMargin }: Props) => {
    const sortedItems = list.defaultSort === "alpha"
        ? [...completed].sort((a, b) => a.name.localeCompare(b.name))
        : completed;

    return (
        <HomepageCollapseCard title="completed" color={list.color} cardKey={`shopping-list-completed-${list.id}`} noTopMargin={noTopMargin}>
            <div className="panel-body">
                {sortedItems.map((item) => {
                    return (
                        <ShoppingListCompletedItem key={item.id} list={list} item={item} />
                    )
                })}
            </div>
        </HomepageCollapseCard>
    )
}