import { useHousehold } from "@/hooks/useHousehold";
import { useToggleShoppingItemMutation, type ShoppingItem, type ShoppingList } from "@/store"
import { Checkbox } from "@mantine/core";
import { useEffect, useState, type ChangeEvent } from "react";

type Props = {
    list: ShoppingList;
    item: ShoppingItem;
}

export const ShoppingListItem = ({ list, item }: Props) => {
    const { data: household } = useHousehold();
    const [checked, setChecked] = useState(item?.isChecked);
    const [toggleShoppingItem] = useToggleShoppingItemMutation();

    useEffect(() => {
        setChecked(item?.isChecked);
    }, [item?.isChecked]);

    const onChange = async (e: ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        const nextChecked = e.currentTarget.checked;

        setChecked(nextChecked);

        try {
            await toggleShoppingItem({
                itemId: item?.id,
                listId: list?.id,
                householdId: household.id
            }).unwrap();
        } catch (err) {
            setChecked((prev) => !prev);
            console.error("Failed to toggle task:", err);
        }
    };

    // useEffect(() => {
    //     // Only apply defaults if tasklist is loaded
    //     if (list?.viewMode) {
    //         // You might want a check here: "Only set this on FIRST load, not every re-render"
    //         // But since useEffect runs on dependency change, and tasklist.defaultFilters 
    //         // usually doesn't change often, this is generally safe.
    //         // If you want strict "on mount only" behavior, you need a Ref to track "hasInitialized".

    //         setViewMode(tasklist.viewMode);
    //     }
    // }, [tasklist?.viewMode]);

    if (!item) return null;
    return (
        <>
            <div className="shopping-list-item--left">
                <div className="shopping-list-item--left-top">
                    <Checkbox
                        radius="xl"
                        color="var(--tasklist-color)"
                        checked={checked}
                        onChange={onChange}
                        size="sm"
                        onClick={(e) => e.stopPropagation()}
                        disabled={list?.isArchived}
                    />
                    {checked ? (
                        <div className="completed-task">{item?.name}</div>
                    ) : (
                        <div className="task-title">{item?.name}</div>
                    )}
                </div>
                <div className="shopping-list-item--left-bottom">
                    <div className="invisible-wall"></div>
                    <div className="shopping-list-item-bottom--left">
                        {/* Quantity / unit pill */}
                        {/* Category pill */}
                        {/* Notes indicator */}
                    </div>
                </div>
            </div>
        </>
    )
}