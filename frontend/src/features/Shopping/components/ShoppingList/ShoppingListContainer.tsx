import { AnimatePresence, motion } from "framer-motion";
import type { ShoppingList } from "@/store";
import { ShoppingListItem } from "./ShoppingListItem";
import { ShoppingListCompleted } from "./ShoppingListCompleted";
import { ShoppingListCategorySection } from "./ShoppingListCategorySection";
import { useShoppingListGroups } from "../../hooks/useShoppingListGroups";
import { ArchiveNotice } from "@/components/ArchiveNotice";

type Props = {
    list: ShoppingList;
};

export const ShoppingListContainer = ({ list }: Props) => {
    const { categoryGroups, uncategorized, checked } = useShoppingListGroups(list);
    const groupedByCategory = list.groupByCategory && categoryGroups.length > 0;

    const sortedItems = list.defaultSort === "alpha"
        ? [...uncategorized, ...categoryGroups.flatMap(group => group.items)].sort((a, b) => a.name.localeCompare(b.name))
        : [...uncategorized, ...categoryGroups.flatMap(group => group.items)];

    return (
        <div className="shopping-list-container">
            {groupedByCategory && categoryGroups.map(({ category, items }) => (
                <ShoppingListCategorySection
                    key={category.id}
                    list={list}
                    categoryId={category.id}
                    categoryName={category.name}
                    items={items}
                />
            ))}

            {(uncategorized.length > 0) && (
                groupedByCategory && categoryGroups.length > 0 ? (
                    <ShoppingListCategorySection
                        key="uncategorized"
                        list={list}
                        categoryId={0}
                        categoryName="Uncategorized"
                        items={uncategorized}
                    />
                ) : (
                    <ul className={`shopping-list${categoryGroups.length === 0 && checked.length > 0 ? " shopping-list--no-bottom-border" : ""}`}>
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
                )
            )}

            {checked.length > 0 &&
                <ShoppingListCompleted
                    list={list}
                    completed={checked}
                    noTopMargin={!groupedByCategory || categoryGroups.length === 0 && uncategorized.length > 0}
                />}
        </div>
    );
};