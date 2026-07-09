import { useRef, useState, type ChangeEvent } from "react";
import { Button } from "@mantine/core";
import { useAddShoppingItemMutation } from "@/store";

type Props = {
    listId: number;
    householdId: number;
    disabled?: boolean;
    color: string;
};

export const FeaturedShoppingQuickAddBar = ({ listId, householdId, disabled, color }: Props) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [itemValue, setItemValue] = useState("");
    const [addItem] = useAddShoppingItemMutation();

    const handleItemInput = (e: ChangeEvent<HTMLInputElement>) => {
        setItemValue(e.target.value);
    };

    const handleAddItem = async () => {
        if (itemValue.trim() === "") return;
        await addItem({ name: itemValue, listId, householdId });
        setItemValue("");
        if (inputRef.current) inputRef.current.focus();
    };

    return (
        <div className="featured-tasklist-quick-add">
            <div className="featured-tasklist-input-container">
                <input
                    disabled={disabled}
                    value={itemValue}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAddItem(); }}
                    onChange={handleItemInput}
                    id="add-shopping-item"
                    type="text"
                    placeholder="Add an item and press Enter"
                    maxLength={255}
                    ref={inputRef}
                />
                <Button fw={500} color={color} variant="filled" size="xs" radius="sm" onClick={handleAddItem}>Add</Button>
            </div>
        </div>
    );
};