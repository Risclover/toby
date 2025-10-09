import { useAddShoppingItemMutation } from "@/store/shoppingSlice";
import { Button } from "@mantine/core";
import { useRef, useState } from "react"

type Props = {
    listId: number;

}
export const ShoppingListAddItem = ({ listId }: Props) => {
    const inputRef = useRef<HTMLInputElement>(null)
    const [inputValue, setInputValue] = useState("");
    const [addShoppingItem, { isLoading: loading }] = useAddShoppingItemMutation();

    const handleValue = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    }

    const handleAddItem = async () => {
        await addShoppingItem({ name: inputValue, listId: listId });
        setInputValue("");
        inputRef.current?.focus();
    }

    return (
        <div className="add-task-container"><div className="add-task shell-footer">
            <input value={inputValue} onKeyDown={(e) => { if (e.key === "Enter") { handleAddItem() } }} ref={inputRef} onChange={handleValue} type="text" placeholder="Add an item and press Enter" />
            <Button color="cyan" loading={loading} onClick={handleAddItem}>Add</Button>
        </div>
        </div>
    )
}