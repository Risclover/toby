import type { ShoppingList } from '@/store/householdSlice'
import { useCompleteShoppingItemMutation, type ShoppingItem } from '@/store/shoppingSlice'
import { Button, Checkbox } from '@mantine/core'
import React, { use, useEffect, useState, type ChangeEvent } from 'react'
import { ItemExpanded } from './ItemExpanded'

type Props = {
    item: ShoppingItem;
    listId: number;
}
export const ListItem = ({ item, listId }: Props) => {
    const [completeItem] = useCompleteShoppingItemMutation();
    const [checked, setChecked] = useState(item.purchased);
    const [showExpanded, setShowExpanded] = useState(false);

    useEffect(() => {
        setChecked(item?.purchased === true);
    }, [item?.purchased]);

    const onChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const nextChecked = e.currentTarget.checked;

        // optimistic UI
        setChecked(nextChecked);

        try {
            await completeItem({
                itemId: item.id,
                listId,
                purchased: nextChecked
            }).unwrap();
        } catch (err) {
            setChecked((prev) => !prev);
            console.error("Failed to toggle todo:", err);
        }
    };
    return (
        <li className="task">
            <div className="task-row">
                <div className="household-tasklist-page-task">
                    <Checkbox radius="xl" size="sm" color="cyan" onChange={onChange} checked={checked} />
                    {item.name}
                    <Button color="cyan" variant="light" size='xs' onClick={() => setShowExpanded((prev) => !prev)}>{showExpanded ? "Collapse" : "Expand"}</Button>
                </div>
            </div>
            {showExpanded && <ItemExpanded item={item} />}
        </li>
    )
}