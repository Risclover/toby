import { AnimatePresence, motion } from "framer-motion";
import { ShoppingListItem } from "./ShoppingListItem";
import { ShoppingListCompleted } from "./ShoppingListCompleted";
import { ShoppingListCategorySection } from "./ShoppingListCategorySection";
import { useShoppingListGroups } from "../../hooks/useShoppingListGroups";
import type { ShoppingList } from "@/store";

type Props = {
    list: ShoppingList;
    groupByCategory: boolean;
    sort: "created" | "alpha";
};

export const ShoppingListContainer = ({ list, groupByCategory, sort }: Props) => {
    const { categoryGroups, uncategorized, checked } = useShoppingListGroups(list, {
        groupByCategory,
        sort,
    });

    const isGrouped = groupByCategory && categoryGroups.length > 0;

    return (
        <div className="shopping-list-container">
            {isGrouped && categoryGroups.map(({ category, items }) => (
                <ShoppingListCategorySection
                    key={category.id}
                    list={list}
                    categoryId={category.id}
                    categoryName={category.name}
                    items={items}
                    sort={sort}
                />
            ))}

            {uncategorized.length > 0 && (
                isGrouped ? (
                    <ShoppingListCategorySection
                        key="uncategorized"
                        list={list}
                        categoryId={0}
                        categoryName="Uncategorized"
                        items={uncategorized}
                        sort={sort}
                    />
                ) : (
                    <ul className={`shopping-list${!isGrouped && checked.length > 0 ? " shopping-list--no-bottom-border" : ""}`}>
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

            {checked.length > 0 && (
                <ShoppingListCompleted
                    list={list}
                    completed={checked}
                    noTopMargin={!isGrouped && uncategorized.length > 0}
                />
            )}
        </div>
    );
};