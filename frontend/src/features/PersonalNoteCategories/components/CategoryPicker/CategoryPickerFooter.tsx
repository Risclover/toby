import { MAX_CATEGORIES } from "../../hooks";

import { FaPlus } from "react-icons/fa6";
import { PiNotePencilFill } from "react-icons/pi";

type Props = {
    /** Current number of categories. */
    categoryCount: number;
    /** Opens the create category modal. */
    onAddClick: () => void;
    /** Opens the manage categories modal. */
    onManageClick: () => void;
}

/**
 * Shared footer for both the category menu and category drawer.
 * Renders "Add category" and "Manage categories" actions with capacity display.
 */
export const CategoryPickerFooter = ({ categoryCount, onAddClick, onManageClick }: Props) => {
    const atLimit = categoryCount >= MAX_CATEGORIES;
    const hasCategories = categoryCount > 0;

    return (
        <div className={`category-drawer-extra-options${hasCategories ? " category-drawer-extra-options--divided" : ""}`}>
            <div
                className={`category-drawer-item add-note-category${atLimit ? " add-category-disabled" : ""}`}
                onClick={atLimit ? undefined : onAddClick}
            >
                <div className="add-note-category">
                    <FaPlus color="var(--mantine-color-gray-7)" size="18px" />
                    Add category
                </div>
                <div className="category-menu-capacity">
                    {atLimit
                        ? <div className="category-menu-capacity--limit">Limit reached</div>
                        : `(Used: ${categoryCount} / ${MAX_CATEGORIES})`
                    }
                </div>
            </div>
            {hasCategories && (
                <div className="category-drawer-item manage-note-category" onClick={onManageClick}>
                    <PiNotePencilFill color="var(--mantine-color-gray-7)" size="18px" />
                    Manage categories
                </div>
            )}
        </div>
    );
};