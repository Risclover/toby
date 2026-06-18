import { AnimatePresence, motion } from "framer-motion";
import type { ShoppingList } from "@/store"
import { ShoppingListItem } from "./ShoppingListItem";

type Props = {
    list: ShoppingList;
}

export const ShoppingListContainer = ({ list }: Props) => {
    const unchecked = list.items.filter(item => !item.isChecked);
    const checked = list.items.filter(item => item.isChecked);

    return (
        <div className="shopping-list-container">
            <ul className="shopping-list">
                <AnimatePresence>
                    {unchecked.map((item) =>
                        item.id < 0 ? (
                            <li key={item.id} className="shopping-list-item">
                                <ShoppingListItem list={list} item={item} />
                            </li>
                        ) : (
                            <motion.li
                                key={item.id}
                                className="shopping-list-item"
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.35 }}
                            >
                                <ShoppingListItem list={list} item={item} />
                            </motion.li>
                        )
                    )}
                </AnimatePresence>
            </ul>

            <AnimatePresence>
                {checked.length > 0 && (
                    <motion.div
                        className="shopping-list-completed"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                    >
                        <div className="shopping-list-completed-heading">Completed</div>

                        <ul className="shopping-list">
                            <AnimatePresence>
                                {checked.map((item) => (
                                    <motion.li
                                        key={item.id}
                                        className="shopping-list-item completed"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.35 }}
                                    >
                                        <ShoppingListItem list={list} item={item} />
                                    </motion.li>
                                ))}
                            </AnimatePresence>
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}