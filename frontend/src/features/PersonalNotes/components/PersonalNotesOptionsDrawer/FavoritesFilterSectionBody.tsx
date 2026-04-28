import { Switch } from "@mantine/core"
import { useNotesFilter, type FavoriteFilter, type NotesFilterState } from "../../hooks/useNotesFilter";
import { useNotesFilterContext } from "@/contexts/NotesFilterContext";

type Props = {
    filterKey: keyof NotesFilterState;
};


export const FavoritesFilterSectionBody = ({ filterKey }: Props) => {
    const { filters, updateFilters } = useNotesFilterContext();

    return (
        <div className="favorites-filter-section-body">
            {/* <span className="favorites-filter-section-body--text">Show favorite notes only</span> */}
            <Switch onChange={(e) => updateFilters({ favoritism: e.currentTarget.checked })} checked={filters.favoritism} styles={{
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
            }} labelPosition="left" label="Show favorite notes only" color="rgb(5, 5, 73)" withThumbIndicator={false} size="md" />
        </div>
    )
}