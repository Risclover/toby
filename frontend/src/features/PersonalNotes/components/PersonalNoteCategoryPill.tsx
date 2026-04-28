import { getLightColor } from "@/utils/getLightColor";
import { useNotesFilterContext } from "@/contexts/NotesFilterContext";

type Props = {
    category: { id: number; name: string; color?: string | null };
    onClick?: (e: React.MouseEvent) => void;
};

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
                color: category.color ?? undefined,
                cursor: "pointer",
            }}
            onClick={handleClick}
        >
            {category.name}
        </div>
    );
};