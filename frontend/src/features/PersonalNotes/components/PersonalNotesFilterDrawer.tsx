import { Button, Drawer } from "@mantine/core";
import { FaCheck } from "react-icons/fa6";
import { useGetCategoriesQuery } from "@/store/noteCategorySlice";
import { useIsSmallScreen } from "@/hooks";
import { getLightColor } from "@/utils/getLightColor";
import { useNotesFilterContext } from "@/contexts/NotesFilterContext";
import type { FavoriteFilter, SortOption, VisibilityFilter } from "../hooks/useNotesFilter";

type Props = {
    opened: boolean;
    onClose: () => void;
};

type OptionRowProps = {
    label: string;
    isActive: boolean;
    color?: string;
    onClick: () => void;
};

const OptionRow = ({ label, isActive, color, onClick }: OptionRowProps) => (
    <div
        className={`filter-drawer-option${isActive ? " active" : ""}`}
        onClick={onClick}
        style={{
            color: color ?? undefined,
            "--item-bg": color ? getLightColor(color) : undefined,
        } as React.CSSProperties}
    >
        <span>{label}</span>
        {isActive && (
            <FaCheck size="13px" color={color ?? "var(--mantine-color-green-5)"} />
        )}
    </div>
);

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: "newest", label: "Newest first" },
    { value: "oldest", label: "Oldest first" },
    { value: "alpha", label: "A → Z" },
    { value: "category_alpha", label: "By category" },
    { value: "private_first", label: "Private first" },
];

const FAVORITISM_OPTIONS: { value: FavoriteFilter; label: string }[] = [
    { value: "all", label: "All notes" },
    { value: "favorites", label: "Favorites only" },
];

const VISIBILITY_OPTIONS: { value: VisibilityFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "public", label: "Public only" },
    { value: "private", label: "Private only" },
];

export const PersonalNotesFilterDrawer = ({ opened, onClose }: Props) => {
    const isSmall = useIsSmallScreen();
    const { data: categories } = useGetCategoriesQuery();
    const { filters, updateFilters, resetFilters, isFiltered } = useNotesFilterContext();

    const handleReset = () => {
        resetFilters();
        onClose();
    };

    return (
        <Drawer
            title="Options"
            className="filter-drawer"
            size="auto"
            styles={{
                content: {
                    height: "min-content",
                    borderTopLeftRadius: "1rem",
                    borderTopRightRadius: "1rem",
                },
                body: { padding: isSmall ? ".75rem" : "1rem" },
            }}
            opened={opened}
            onClose={onClose}
            position="bottom"
        >
            <div className="notes-filter-drawer-content">
                <div className="notes-filter-section">
                    <div className="notes-filter-section-label">Sort by</div>
                    {SORT_OPTIONS.map(opt => (
                        <OptionRow
                            key={opt.value}
                            label={opt.label}
                            isActive={filters.sort === opt.value}
                            onClick={() => updateFilters({ sort: opt.value })}
                        />
                    ))}
                </div>

                <div className="notes-filter-section">
                    <div className="notes-filter-section-label">Show</div>
                    {FAVORITISM_OPTIONS.map(opt => (
                        <OptionRow
                            key={opt.value}
                            label={opt.label}
                            isActive={filters.favoritism === opt.value}
                            onClick={() => updateFilters({ favoritism: opt.value })}
                        />
                    ))}
                </div>

                <div className="notes-filter-section">
                    <div className="notes-filter-section-label">Visibility</div>
                    {VISIBILITY_OPTIONS.map(opt => (
                        <OptionRow
                            key={opt.value}
                            label={opt.label}
                            isActive={filters.visibility === opt.value}
                            onClick={() => updateFilters({ visibility: opt.value })}
                        />
                    ))}
                </div>

                {categories && categories.length > 0 && (
                    <div className="notes-filter-section">
                        <div className="notes-filter-section-label">Category</div>
                        <OptionRow
                            label="All categories"
                            isActive={filters.categoryIds.length === 0}
                            onClick={() => updateFilters({ categoryIds: [] })}
                        />
                        {categories.map(cat => (
                            <OptionRow
                                key={cat.id}
                                label={cat.name}
                                isActive={filters.categoryIds.includes(cat.id)}
                                color={cat.color}
                                onClick={() => {
                                    const already = filters.categoryIds.includes(cat.id);
                                    updateFilters({
                                        categoryIds: already
                                            ? filters.categoryIds.filter(id => id !== cat.id)
                                            : [...filters.categoryIds, cat.id],
                                    });
                                }}
                            />
                        ))}
                    </div>
                )}

                {isFiltered && (
                    <Button
                        variant="subtle"
                        color="red"
                        size="xs"
                        mt="xs"
                        onClick={handleReset}
                    >
                        Reset all filters
                    </Button>
                )}
            </div>
        </Drawer>
    );
};
