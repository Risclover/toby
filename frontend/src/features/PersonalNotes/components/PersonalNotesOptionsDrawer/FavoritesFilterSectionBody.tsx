import { Switch } from "@mantine/core"
import { useNotesFilterContext } from "@/contexts";

/** Favorites section in the Filters drawer */
export const FavoritesFilterSectionBody = () => {
    const { filters, updateFilters } = useNotesFilterContext();

    return (
        <div className="favorites-filter-section-body">
            <Switch
                onChange={(e) => updateFilters({ favoritism: e.currentTarget.checked })}
                checked={filters.favoritism}
                styles={{
                    root: {
                        width: "100%",
                    },
                    body: {
                        display: "flex",
                        justifyContent: "space-between",
                        width: "100%",
                        fontSize: "15px"
                    },
                    label: {
                        fontSize: "14px",
                        fontWeight: 400
                    }
                }}
                labelPosition="left"
                label="Show favorite notes only"
                color="rgb(5, 5, 73)"
                withThumbIndicator={false}
                size="md"
            />
        </div>
    )
}