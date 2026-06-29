import { useHousehold } from "@/hooks/useHousehold";
import { useToggleShoppingItemMutation, type ShoppingItem, type ShoppingList } from "@/store"
import { Checkbox, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useEffect, useState, type ChangeEvent } from "react";
import { ShoppingListItemDetailPill } from "./ShoppingListItemDetailPill";
import { getUnitLabel } from "../../constants/shoppingUnits";
import { ShoppingListDetailsPanel } from "./ShoppingListDetailsPanel";
import TextSnippetIcon from '@mui/icons-material/TextSnippet';

type Props = {
    list: ShoppingList;
    item: ShoppingItem;
}

export const ShoppingListItem = ({ list, item }: Props) => {
    const { data: household } = useHousehold();
    const [toggleShoppingItem] = useToggleShoppingItemMutation();
    const [checked, setChecked] = useState(item?.isChecked);
    const [showDetailsPanel, setShowDetailsPanel] = useState(false);

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

    const handleOpenDetails = () => {
        setShowDetailsPanel(true);
    }

    if (!item) return null;
    return (
        <>
            <div onClick={handleOpenDetails} className="shopping-list-item">
                <div className="shopping-list-item--top">
                    <div className="shopping-list-item--top-left">
                        <Checkbox
                            radius="xl"
                            color={list.color}
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
                    <div className="shopping-list-item--top-right">
                        <ShoppingListItemDetailPill item={item} />
                    </div>
                </div>
                <div className="shopping-list-item--bottom">
                    <div className="invisible-wall"></div>
                    {item?.notes && !item.isChecked &&
                        <div className="shopping-list-item-notes">
                            <TextSnippetIcon />
                            <Text size="xs" maw="100%" truncate>{item?.notes}</Text>
                        </div>
                    }
                </div>
            </div>
            <ShoppingListDetailsPanel
                item={item}
                opened={showDetailsPanel}
                close={() => setShowDetailsPanel(false)}
                list={list}
            />
        </>
    )
}