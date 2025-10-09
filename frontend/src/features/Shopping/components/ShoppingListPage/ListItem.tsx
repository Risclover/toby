import type { ShoppingList } from '@/store/householdSlice'
import { useCompleteShoppingItemMutation, type ShoppingItem } from '@/store/shoppingSlice'
import { Badge, Button, Checkbox, Group } from '@mantine/core'
import React, { use, useEffect, useState, type ChangeEvent } from 'react'
import { ItemExpanded } from './ItemExpanded'
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import { ItemDeletionConfirmation } from './ItemDeletionConfirmation'
import ArrowDropDownRoundedIcon from '@mui/icons-material/ArrowDropDownRounded';
import ArrowDropUpRoundedIcon from '@mui/icons-material/ArrowDropUpRounded';

type Props = {
    item: ShoppingItem;
    listId: number;
    uncompleted?: boolean;
}
export const ListItem = ({ item, listId, uncompleted }: Props) => {
    const [completeItem] = useCompleteShoppingItemMutation();
    const [checked, setChecked] = useState(item.purchased);
    const [showExpanded, setShowExpanded] = useState(false);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

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
                    <div className="task-left">
                        <Checkbox radius="xl" size="sm" color="cyan" onChange={onChange} checked={checked} />
                        {item.name}
                    </div>
                    {uncompleted && <div className="task-right">
                        <Badge color="cyan" variant="light">{item.category}</Badge>
                        <Button color="cyan" variant="transparent" onClick={() => setShowExpanded((prev) => !prev)}>
                            {showExpanded ? <ArrowDropUpRoundedIcon /> : <ArrowDropDownRoundedIcon />}
                        </Button>
                        <Button color="cyan" variant="transparent" onClick={() => setShowDeleteConfirmation(true)}>
                            <DeleteRoundedIcon />
                        </Button>
                    </div>}
                </div>
            </div>
            {showDeleteConfirmation && <ItemDeletionConfirmation showDeleteConfirmation={showDeleteConfirmation} setShowDeleteConfirmation={setShowDeleteConfirmation} item={item} listId={listId} />}
            {showExpanded && <ItemExpanded item={item} />}
        </li>
    )
}