import { Button } from "@mantine/core";
import { ShoppingListAddItemDetails } from "./AddItemDetails/ShoppingListAddItemDetails";
import { useShoppingListAddItem } from "../hooks/useShoppingListAddItem";
import type { ShoppingList } from "@/store";

/** Props for ShoppingListAddItem. */
type Props = {
    /** The shopping list new items will be added to. */
    list: ShoppingList;
};

/**
 * Text input for adding a new item to a shopping list. Focusing the input
 * reveals an expandable details row (quantity/unit/category); clicking away
 * with no text or details entered collapses it back down.
 */
export const ShoppingListAddItem = ({ list }: Props) => {
    const {
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
    } = useShoppingListAddItem(list);

    return (
        <div className="add-shopping-item-container" ref={containerRef}>
            <div className="add-shopping-item shell-footer">
                <div className="add-shopping-item-input">
                    <input
                        value={inputValue}
                        onKeyDown={handleKeyDown}
                        ref={inputRef}
                        onChange={handleInputChange}
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
                        details={details}
                        onDetailsChange={detailsHandlers}
                    />
                )}
            </div>
        </div>
    );
};
