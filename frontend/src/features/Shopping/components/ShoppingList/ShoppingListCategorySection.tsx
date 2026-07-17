import { AnimatePresence, motion } from "framer-motion";
import { HomepageCollapseCard } from "@/components/HomepageCollapseCard/HomepageCollapseCard";
import { ShoppingListItem } from "./ShoppingListItem";
import type { ShoppingItem, ShoppingList } from "@/store";

type Props = {
    list: ShoppingList;
    categoryId: number;
    categoryName: string;
    items: ShoppingItem[];
    sort: "created" | "alpha";
};

export const ShoppingListCategorySection = ({ list, categoryId, categoryName, items, sort }: Props) => {
    const sortedItems = sort === "alpha"
        ? [...items].sort((a, b) => a.name.localeCompare(b.name))
        : items;

    return (
        <HomepageCollapseCard
            title={categoryName}
            color={list.color}
            cardKey={`list-category-${categoryId}`}
        >
            <ul className="shopping-list">
                <AnimatePresence>
                    {sortedItems.map((item) =>
                        item.id < 0 ? (
                            <li key={item.id} className="shopping-list-li-item">
                                <ShoppingListItem list={list} item={item} />
                            </li>
                        ) : (
                            <motion.li
                                key={item.id}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.35 }}
                                className="shopping-list-li-item"
                            >
                                <ShoppingListItem list={list} item={item} />
                            </motion.li>
                        )
                    )}
                </AnimatePresence>
            </ul>
        </HomepageCollapseCard>
    );
};