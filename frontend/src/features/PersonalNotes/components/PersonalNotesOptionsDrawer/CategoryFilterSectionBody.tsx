// CategoryFilterSectionBody.tsx
import { Button, Chip, Group } from "@mantine/core";
import { useGetCategoriesQuery, useGetUserNoteCategoriesQuery } from "@/store/noteCategorySlice";
import { useNotesFilterContext } from "@/contexts/NotesFilterContext";
import { FaCheck } from "react-icons/fa6";
import { useParams } from "react-router-dom";

export const CategoryFilterSectionBody = () => {
    const { filters, updateFilters } = useNotesFilterContext();
    const { userId } = useParams();
    const { data: categories } = useGetUserNoteCategoriesQuery(Number(userId));

    console.log('CATEGORIES:', categories);
    const toggle = (id: number) => {
        const already = filters.categoryIds.includes(id);
        updateFilters({
            categoryIds: already
                ? filters.categoryIds.filter(existing => existing !== id)
                : [...filters.categoryIds, id],
        });
    };

    if (!categories) return null;
    return (
        <div className="notes-filter-section-body notes-filter-section-categories">
            <div className="notes-filter-section-body--label">
                Categories
                {filters.categoryIds.length > 0 && <Button styles={{ root: { background: "transparent" } }} h="auto" disabled={filters.categoryIds.length === 0} fw={500} size="compact-sm" variant="transparent" onClick={() => updateFilters({ categoryIds: [] })}>Clear</Button>}
            </div>
            {categories.length === 0 ? <div>No categories found for this user.</div> : ""}
            {/* <Button
                    color="rgb(5, 5, 73)"
                    size="sm"
                    h="auto"
                    p="0.5rem 1rem"
                    fw={500}
                    variant={filters.categoryIds.length === 0 ? "filled" : "outline"}
                    onClick={() => updateFilters({ categoryIds: [] })}
                    styles={{
                        root: {
                            fontFamily: "var(--font-family-sora)"
                        }
                    }}
                >
                    All
                </Button> */}
            <Chip.Group multiple>
                <Group gap="6px">
                    {categories.map(cat => (
                        <Chip styles={{ label: { fontFamily: "var(--font-family-sora)", fontSize: "13px" } }} key={cat.id} icon={<FaCheck />} size="sm" variant="light" color={cat.color} checked={filters.categoryIds.includes(cat.id)} onClick={() => toggle(cat.id)}>{cat.name}</Chip>
                    ))}
                </Group>
            </Chip.Group>
        </div>
    );
};