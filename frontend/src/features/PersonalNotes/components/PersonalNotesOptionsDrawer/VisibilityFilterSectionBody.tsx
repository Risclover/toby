// NotesFilterSectionBody.tsx
import { SegmentedControl } from "@mantine/core";

import { useNotesFilterContext } from "@/contexts";
import type { VisibilityFilter } from "../../hooks";

type Props = {
    /** Options for the visibility segmented control */
    options: { value: string; label: string }[];
};

/** Visibility section in the Filters drawer */
export const VisibilityFilterSectionBody = ({ options }: Props) => {
    const { filters, updateFilters } = useNotesFilterContext();

    return (
        <div className="notes-filter-section-body">
            <div className="notes-filter-section-body--label">Visibility</div>
            <SegmentedControl
                defaultValue={filters.visibility}
                data={options}
                color="rgb(5, 5, 73)"
                onChange={(val) => updateFilters({ visibility: val as VisibilityFilter })}
                styles={{
                    label: {
                        padding: ".25rem 1.25rem",
                        fontFamily: "var(--font-family-sora)",
                        fontSize: "14px",
                    }
                }}
            />
        </div>
    );
};