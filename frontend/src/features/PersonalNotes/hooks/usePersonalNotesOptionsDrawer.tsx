import { useNotesFilterContext } from "@/contexts";
import { useDrawersStack, type DrawerProps } from "@mantine/core";
import { HiViewGrid } from "react-icons/hi";
import { LuListFilter } from "react-icons/lu";
import { TbArrowsSort } from "react-icons/tb";
import type { SortOption, ViewOption } from "./useNotesFilter";

export const SORT_LABELS: Record<SortOption, string> = {
    newest: "Newest first",
    oldest: "Oldest first",
    alpha: "A → Z",
    category_alpha: "By category",
    private_first: "Private first",
};

type UsePersonalNotesOptionsDrawerProps = {
    sort: SortOption;
    view: ViewOption;
}
export const usePersonalNotesOptionsDrawer = ({ sort, view }: UsePersonalNotesOptionsDrawerProps) => {
    const stack = useDrawersStack(["options", "filters", "sort", "view"]);
    const { filters, isFiltered } = useNotesFilterContext();

    const filterCount = [
        filters.favoritism,
        filters.visibility !== "all",
        filters.categoryIds.length > 0,
    ].filter(Boolean).length;

    const optionsDrawerButtons = [
        {
            title: "Sort by",
            icon: <TbArrowsSort />,
            activeOption: SORT_LABELS[sort],
            onClick: () => stack.open("sort"),
        },
        {
            title: "Filters",
            icon: <LuListFilter />,
            activeOption: filterCount > 0 ? `${filterCount} filter${filterCount !== 1 ? "s" : ""}` : "",
            onClick: () => stack.open("filters"),
        },
        {
            title: "View",
            icon: <HiViewGrid />,
            activeOption: view === "grid" ? "Grid view" : "List view",
            onClick: () => stack.open("view"),
        },
    ];

    const drawerProps = {
        styles: {
            content: {
                height: "min-content",
                borderTopLeftRadius: "1rem",
                borderTopRightRadius: "1rem",
            },
            body: { padding: "1rem", paddingTop: ".5rem" },
        },
        size: "auto",
        className: "notes-options-drawer",
        position: "bottom",
    } as DrawerProps;

    return {
        stack,
        isFiltered,
        optionsDrawerButtons,
        drawerProps
    }
}