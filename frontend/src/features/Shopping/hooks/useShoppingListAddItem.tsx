import { useRef, useState } from "react";
import { Text } from "@mantine/core";
import { KittyNotification } from "@/components";
import { useOutsideClick, useHousehold } from "@/hooks";
import { useAddShoppingItemMutation, type ShoppingList } from "@/store";
import type { ShoppingItemDetails, ShoppingItemDetailsHandlers } from "../types";
import { KittyIcons } from "@/assets";

const emptyDetails: ShoppingItemDetails = {
    quantity: 0,
    draftQuantity: 0,
    qtyOpened: false,
    unit: "",
    categoryId: null,
};

type ItemNotificationMessageProps = {
    itemName: string;
    listTitle: string;
};

/** Success message body shown after an item is added, with the item and list names bolded. */
const ItemAddedMessage = ({ itemName, listTitle }: ItemNotificationMessageProps) => (
    <>
        A new item, "<Text span fw={500} c="black" size="sm">{itemName}</Text>", was added to "<Text span fw={500} c="black" size="sm">{listTitle}</Text>".
    </>
);

/** Error message body shown when adding an item fails, with the item and list names bolded. */
const ItemAddErrorMessage = ({ itemName, listTitle }: ItemNotificationMessageProps) => (
    <>
        Toby was distracted and failed to add "<Text span fw={500}>{itemName}</Text>" to "<Text span fw={500}>{listTitle}</Text>". Try again.
    </>
);

/**
 * Encapsulates all state and behavior for the "add shopping item" row: the
 * text input, the expandable quantity/unit/category details, and submitting
 * the new item to the API. Returns everything ShoppingListAddItem needs to
 * render, so the component itself stays presentational.
 */
export const useShoppingListAddItem = (list: ShoppingList) => {
    // Refs
    const inputRef = useRef<HTMLInputElement | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // State
    const [inputValue, setInputValue] = useState("");
    const [showDetails, setShowDetails] = useState(false);
    const [details, setDetails] = useState<ShoppingItemDetails>(emptyDetails);

    // Other hooks
    const [addShoppingItem, { isLoading: loading }] = useAddShoppingItemMutation();
    const { data: household } = useHousehold();
    useOutsideClick(containerRef, handleOutsideClick);

    // Handlers
    const detailsHandlers: ShoppingItemDetailsHandlers = {
        setQuantity: (quantity) => setDetails((prev) => ({ ...prev, quantity })),
        setDraftQuantity: (draftQuantity) => setDetails((prev) => ({ ...prev, draftQuantity })),
        setQtyOpened: (qtyOpened) => setDetails((prev) => ({ ...prev, qtyOpened })),
        setUnit: (unit) => setDetails((prev) => ({ ...prev, unit })),
        setCategoryId: (categoryId) => setDetails((prev) => ({ ...prev, categoryId })),
    };

    /** Collapses the details panel and clears its state once the input and details are both empty. */
    function handleOutsideClick() {
        // Only flush draftQuantity if the popover is still open — if it's already closed,
        // it handled its own commit/discard and quantity is already correct.
        const committedQuantity = details.qtyOpened ? details.draftQuantity : details.quantity;
        const hasDetails = committedQuantity > 0 || details.categoryId !== null;

        if (inputValue.trim().length === 0 && !hasDetails) {
            setShowDetails(false);
            setDetails(emptyDetails);
            return;
        }

        if (details.qtyOpened) {
            setDetails((prev) => ({ ...prev, quantity: committedQuantity }));
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    const handleFocus = () => setShowDetails(true);

    /** Submits the current input and details as a new shopping item, then resets the form. */
    const handleAddItem = async () => {
        const name = inputValue.trim();
        if (name.length === 0) return;

        try {
            await addShoppingItem({
                name,
                listId: list.id,
                householdId: household?.id,
                quantity: details.quantity > 0 ? details.quantity : "",
                unit: details.unit.length > 0 ? details.unit : "",
                categoryId: details.categoryId,
            }).unwrap();

            setInputValue("");
            inputRef.current?.focus();
            setDetails((prev) => ({ ...prev, quantity: 0, draftQuantity: 0, qtyOpened: false, unit: "" }));

            KittyNotification({
                title: "Item added successfully!",
                message: <ItemAddedMessage itemName={name} listTitle={list.title} />,
                icon: KittyIcons.Party,
                color: "green",
            });
        } catch (error) {
            console.error("Error adding shopping item:", error);
            KittyNotification({
                title: "Couldn't add item",
                message: <ItemAddErrorMessage itemName={name} listTitle={list.title} />,
                icon: KittyIcons.Reading,
                color: "red",
            });
        }
    };

    /** Submits on Enter. */
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") handleAddItem();
    };

    return {
        inputRef,
        containerRef,
        inputValue,
        handleInputChange,
        handleKeyDown,
        showDetails,
        handleFocus,
        details,
        detailsHandlers,
        loading,
        handleAddItem,
    };
};
