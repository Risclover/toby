// NotesFilterSectionBody.tsx
import { useNotesFilterContext } from "@/contexts/NotesFilterContext";
import { Button, Group, SegmentedControl } from "@mantine/core";
import type { NotesFilterState, VisibilityFilter } from "../../hooks/useNotesFilter";

type Props = {
    filterKey: keyof NotesFilterState;
    options: { value: string; label: string }[];
};

export const NotesFilterSectionBody = ({ filterKey, options }: Props) => {
    const { filters, updateFilters } = useNotesFilterContext();

    return (
        <div className="notes-filter-section-body">
            <div className="notes-filter-section-body--label">Visibility</div>
            <SegmentedControl defaultValue={filters.visibility} data={options} color="rgb(5, 5, 73)" onChange={(val) => updateFilters({ visibility: val as VisibilityFilter })} styles={{
                label: {
                    padding: ".25rem 1.25rem",
                    fontFamily: "var(--font-family-sora)",
                    fontSize: "14px",
                }
            }} />
            {/* {options.map(option => (
                    <Button
                        key={option.value}
                        color="rgb(5, 5, 73)"
                        size="sm"
                        h="auto"
                        p="0.5rem .75rem"
                        radius="sm"
                        fw={500}
                        variant={filters[filterKey] === option.value ? "filled" : "outline"}
                        onClick={() => updateFilters({ [filterKey]: option.value })}
                        styles={{
                            root: {
                                fontFamily: "var(--font-family-sora)"
                            }
                        }}
                    >
                        {option.label}
                    </Button>
                ))} */}
        </div>
    );
};