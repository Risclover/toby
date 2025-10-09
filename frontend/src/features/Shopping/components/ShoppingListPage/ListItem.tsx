import { useGetShoppingListCategoriesQuery, useToggleShoppingItemMutation, type ShoppingItem } from '@/store/shoppingSlice'
import { Badge, Button, Checkbox } from '@mantine/core'
import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { ItemExpanded } from './ItemExpanded'
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded'
import { ItemDeletionConfirmation } from './ItemDeletionConfirmation'
import ArrowDropDownRoundedIcon from '@mui/icons-material/ArrowDropDownRounded'
import ArrowDropUpRoundedIcon from '@mui/icons-material/ArrowDropUpRounded'

type Props = {
    item: ShoppingItem;        // expects { categoryId: number | null; categoryName?: string | null }
    listId: number;
    uncompleted?: boolean;
};

export const ListItem = ({ item, listId, uncompleted }: Props) => {
    const [completeItem] = useToggleShoppingItemMutation()
    const [checked, setChecked] = useState(item.purchased)
    const [showExpanded, setShowExpanded] = useState(false)
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)

    // pull categories for this list so we can map id -> name
    const { data: categories = [] } = useGetShoppingListCategoriesQuery(listId)

    useEffect(() => {
        setChecked(item.purchased === true)
    }, [item.purchased])

    const onChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const nextChecked = e.currentTarget.checked
        setChecked(nextChecked) // optimistic
        try {
            await completeItem({ itemId: item.id, listId, purchased: nextChecked }).unwrap()
        } catch (err) {
            setChecked((prev) => !prev) // rollback
            console.error('Failed to toggle item:', err)
        }
    }

    // Prefer denorm if you return it; otherwise map id -> name from categories
    const categoryLabel = useMemo(() => {
        if (item.categoryName != null) return item.categoryName
        const found = categories.find((c: { id: number; name: string }) => c.id === item.categoryId)
        return found?.name ?? null
    }, [item.categoryName, item.categoryId, categories])

    return (
        <li className="task">
            <div className="task-row">
                <div className="household-tasklist-page-task">
                    <div className="task-left">
                        <Checkbox radius="xl" size="sm" color="cyan" onChange={onChange} checked={checked} />
                        {item.name}
                    </div>

                    {uncompleted && (
                        <div className="task-right">
                            <Badge color="cyan" variant="white" size="lg">{item.quantity}{"x".toLowerCase()}</Badge>
                            {categoryLabel && <Badge color="cyan" size="lg" variant="filled">{categoryLabel}</Badge>}
                            <Button color="cyan" variant="transparent" onClick={() => setShowExpanded((prev) => !prev)}>
                                {showExpanded ? <ArrowDropUpRoundedIcon /> : <ArrowDropDownRoundedIcon />}
                            </Button>
                            <Button color="cyan" variant="transparent" onClick={() => setShowDeleteConfirmation(true)}>
                                <DeleteRoundedIcon />
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {showDeleteConfirmation && (
                <ItemDeletionConfirmation
                    showDeleteConfirmation={showDeleteConfirmation}
                    setShowDeleteConfirmation={setShowDeleteConfirmation}
                    item={item}
                    listId={listId}
                />
            )}

            {showExpanded && <ItemExpanded item={item} />}
        </li>
    )
}
