import { AnimatePresence, motion } from "framer-motion";
import type { ShoppingList } from "@/store";
import { ShoppingListItem } from "./ShoppingListItem";
import { ShoppingListCompleted } from "./ShoppingListCompleted";
import { ShoppingListCategorySection } from "./ShoppingListCategorySection";
import { useShoppingListGroups } from "../../hooks/useShoppingListGroups";

type Props = {
    list: ShoppingList;
};

export const ShoppingListContainer = ({ list }: Props) => {
    const { categoryGroups, uncategorized, checked } = useShoppingListGroups(list);

    return (
        <div className="shopping-list-container">
            {categoryGroups.map(({ category, items }) => (
                <ShoppingListCategorySection
                    key={category.id}
                    list={list}
                    categoryId={category.id}
                    categoryName={category.name}
                    items={items}
                />
            ))}

            {uncategorized.length > 0 && (
                categoryGroups.length > 0 ? (
                    <ShoppingListCategorySection
                        key="uncategorized"
                        list={list}
                        categoryId={0}
                        categoryName="Uncategorized"
                        items={uncategorized}
                    />
                ) : (
                    <ul className="shopping-list">
                        <AnimatePresence>
                            {uncategorized.map((item) =>
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
                )
            )}

            <ShoppingListCompleted list={list} completed={checked} />
        </div>
    );
};