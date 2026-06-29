import type { ShoppingItem, ShoppingList } from "@/store";
import { HomepageCollapseCard } from "@/components/HomepageCollapseCard/HomepageCollapseCard";
import { ShoppingListItem } from "./ShoppingListItem";
import { AnimatePresence, motion } from "framer-motion";

type Props = {
    list: ShoppingList;
    categoryId: number;
    categoryName: string;
    items: ShoppingItem[];
};

export const ShoppingListCategorySection = ({ list, categoryId, categoryName, items }: Props) => {
    return (
        <HomepageCollapseCard
            title={categoryName}
            color={list.color}
            cardKey={`list-category-${categoryId}`}
        >
            <ul className="shopping-list">
                <AnimatePresence>
                    {items.map((item) =>
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