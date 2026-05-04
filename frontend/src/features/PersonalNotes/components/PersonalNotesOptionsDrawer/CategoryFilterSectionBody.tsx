// CategoryFilterSectionBody.tsx
import { Button, Chip, Group } from "@mantine/core";

import { useNotesFilterContext } from "@/contexts";
import { useCategoryFilterSectionBody } from "../../hooks";
import { type PersonalNoteCategory } from "@/store";
import { getContrastTextColor } from "@/utils";

import { FaCheck } from "react-icons/fa6";

/** Categories section in the filters drawer */
export const CategoryFilterSectionBody = () => {
    const { filters, updateFilters } = useNotesFilterContext();
    const { toggle, categories } = useCategoryFilterSectionBody({ filters, updateFilters });

    if (!categories) return null;
    return (
        <div className="notes-filter-section-body notes-filter-section-categories">
            <div className="notes-filter-section-body--label">
                Categories
                {filters.categoryIds.length > 0 &&
                    <Button
                        styles={{ root: { background: "transparent" } }}
                        h="auto"
                        disabled={filters.categoryIds.length === 0}
                        fw={500}
                        size="compact-sm"
                        variant="transparent"
                        onClick={() => updateFilters({ categoryIds: [] })}
                    >
                        Clear
                    </Button>
                }
            </div>

            {/* Empty state */}
            {categories.length === 0 ? <div>No categories found for this user.</div> : ""}

            <Chip.Group multiple>
                <Group gap="6px">
                    {categories.map((cat: PersonalNoteCategory) => (
                        <Chip
                            styles={{
                                label: {
                                    fontFamily: "var(--font-family-sora)",
                                    fontSize: "13px",
                                    color: filters.categoryIds.includes(cat.id)
                                        ? getContrastTextColor(cat.color)
                                        : undefined,
                                }
                            }}
                            key={cat.id}
                            icon={<FaCheck />}
                            size="sm"
                            variant="light"
                            color={cat.color}
                            checked={filters.categoryIds.includes(cat.id)}
                            onClick={() => toggle(cat.id)}
                        >
                            {cat.name}
                        </Chip>
                    ))}
                </Group>
            </Chip.Group>
        </div>
    );
};
