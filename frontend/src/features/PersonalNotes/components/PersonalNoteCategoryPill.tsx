import { useNotesFilterContext } from "@/contexts";
import { getLightColor, getContrastTextColor } from "@/utils";

type Props = {
    /** The category to display */
    category: { id: number; name: string; color?: string | null };
    /** Optional click handler; defaults to applying this category as a filter */
    onClick?: (e: React.MouseEvent) => void;
};

/** Pill component for displaying a note's category */
export const PersonalNoteCategoryPill = ({ category, onClick }: Props) => {
    const { updateFilters } = useNotesFilterContext();

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onClick) {
            onClick(e);
        } else {
            updateFilters({ categoryIds: [category.id] });
        }
    };

    return (
        <div
            className="personal-note-category"
            style={{
                background: getLightColor(category.color ?? "#000000"),
                color: getContrastTextColor(category.color),
                cursor: "pointer",
            }}
            onClick={handleClick}
        >
            {category.name}
        </div>
    );
};