import { useHousehold } from "@/hooks/useHousehold";
import { useAddShoppingItemMutation, type ShoppingList } from "@/store/shoppingSlice";
import { Button } from "@mantine/core";
import { useRef, useState } from "react"
import { ShoppingListAddItemDetails } from "./AddItemDetails/ShoppingListAddItemDetails";
import { useOutsideClick } from "@/hooks";
import { KittyNotification } from "@/components";
import { KittyIcons } from "@/assets";

type Props = {
    list: ShoppingList;
}
export const ShoppingListAddItem = ({ list }: Props) => {
    const inputRef = useRef<HTMLInputElement | null>(null)
    const containerRef = useRef<HTMLDivElement>(null);
    const [inputValue, setInputValue] = useState("");
    const [showDetails, setShowDetails] = useState(false);
    const [quantity, setQuantity] = useState(0);
    const [draftQuantity, setDraftQuantity] = useState(0);
    const [qtyOpened, setQtyOpened] = useState(false);
    const [unit, setUnit] = useState("");
    const [categoryId, setCategoryId] = useState<number | null>(null);
    const [addShoppingItem, { isLoading: loading }] = useAddShoppingItemMutation();
    const { data: household } = useHousehold();

    const handleOutsideClick = () => {
        // Only flush draftQuantity if the popover is still open — if it's already closed,
        // it handled its own commit/discard and quantity is already correct
        const committedQuantity = qtyOpened ? draftQuantity : quantity;
        if (qtyOpened) setQuantity(committedQuantity);

        const hasDetails = committedQuantity > 0 || categoryId !== null;

        if (inputValue.trim().length === 0 && !hasDetails) {
            setShowDetails(false);
            setQuantity(0);
            setDraftQuantity(0);
            setQtyOpened(false);
            setUnit("");
            setCategoryId(null);
        }
    };

    useOutsideClick(containerRef, handleOutsideClick);

    const handleValue = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    const handleAddItem = async () => {
        if (inputValue.trim().length === 0) return;

        try {
            await addShoppingItem({
                name: inputValue.trim(),
                listId: list.id,
                householdId: household?.id,
                quantity: quantity > 0 ? quantity : "",
                unit: unit.length > 0 ? unit : "",
                categoryId,
            }).unwrap();

            setInputValue("");
            inputRef.current?.focus();
            setQuantity(0);
            setDraftQuantity(0);
            setQtyOpened(false);
            setUnit("");

            KittyNotification({
                title: "Item added successfully!",
                message: <>A new item, "<strong style={{ fontWeight: 500 }}>{inputValue.trim()}</strong>", was added to "<strong style={{ fontWeight: 500 }}>{list.title}</strong>".</>,
                icon: KittyIcons.Celebrate,
                color: "green"
            })
        } catch (error) {
            console.error("Error adding shopping item:", error);
            KittyNotification({
                title: "Couldn't add item",
                message: <>Toby was distracted and failed to add "<strong style={{ fontWeight: 500 }}>{inputValue.trim()}</strong>" to "<strong style={{ fontWeight: 500 }}>{list.title}</strong>". Try again.</>,
                icon: KittyIcons.Selfie,
                color: "red"
            })
        }
    }

    const handleFocus = () => {
        setShowDetails(true);
    }

    return (
        <div className="add-shopping-item-container" ref={containerRef}>
            <div className="add-shopping-item shell-footer">
                <div className="add-shopping-item-input">
                    <input
                        value={inputValue}
                        onKeyDown={(e) => { if (e.key === "Enter") { handleAddItem() } }}
                        ref={inputRef}
                        onChange={handleValue}
                        onFocus={handleFocus}
                        type="text"
                        placeholder="Add an item and press Enter"
                        className="add-item-input"
                        maxLength={100}
                        disabled={list.isArchived}
                    />
                    <Button
                        color={list.color}
                        loading={loading}
                        onClick={handleAddItem}
                        disabled={inputValue.trim().length === 0}
                    >
                        Add
                    </Button>
                </div>
                {showDetails && (
                    <ShoppingListAddItemDetails
                        list={list}
                        quantity={quantity}
                        setQuantity={setQuantity}
                        draftQuantity={draftQuantity}
                        setDraftQuantity={setDraftQuantity}
                        qtyOpened={qtyOpened}
                        setQtyOpened={setQtyOpened}
                        unit={unit}
                        setUnit={setUnit}
                        categoryId={categoryId}
                        setCategoryId={setCategoryId}
                    />
                )}
            </div>
        </div>
    )
}