import { useIsSmallScreen } from "@/hooks";
import { ActionIcon, Drawer, Indicator, useDrawersStack } from "@mantine/core";
import { OptionsDrawerButton } from "./OptionsDrawerButton";
import { TbArrowsSort } from "react-icons/tb";
import { LuListFilter } from "react-icons/lu";
import { HiViewGrid } from "react-icons/hi";
import { IoOptions } from "react-icons/io5";
import { PersonalNotesSortDrawer } from "./PersonalNotesSortDrawer";
import type { SortOption, ViewOption } from "../../hooks/useNotesFilter";
import { PersonalNotesFilterDrawer } from "./PersonalNotesFilterDrawer";
import { useNotesFilterContext } from "@/contexts/NotesFilterContext";
import { PersonalNotesViewDrawer } from "./PersonalNotesViewDrawer";

const SORT_LABELS: Record<SortOption, string> = {
    newest: "Newest first",
    oldest: "Oldest first",
    alpha: "A → Z",
    category_alpha: "By category",
    private_first: "Private first",
};

type Props = {
    isFiltered: boolean;
    sort: SortOption;
    onSortChange: (val: SortOption) => void;
    view: ViewOption;
    onViewChange: (val: ViewOption) => void;
};

export const PersonalNotesOptionsDrawer = ({ sort, onSortChange, view, onViewChange }: Props) => {
    const stack = useDrawersStack(["options", "filters", "sort", "view"]);
    const isSmall = useIsSmallScreen(425);
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
    } as const;

    return (
        <>
            <Drawer.Stack>
                <Drawer title="Options" {...drawerProps} {...stack.register("options")}>
                    <div className="notes-options-drawer--body">
                        {optionsDrawerButtons.map(btn => (
                            <OptionsDrawerButton
                                key={btn.title}
                                icon={btn.icon}
                                title={btn.title}
                                onClick={btn.onClick}
                                activeOption={btn.activeOption}
                            />
                        ))}
                    </div>
                </Drawer>
                <PersonalNotesSortDrawer
                    drawerProps={drawerProps}
                    stack={stack}
                    sort={sort}
                    onSortChange={onSortChange}
                />
                <PersonalNotesFilterDrawer drawerProps={drawerProps} stack={stack} />
                <PersonalNotesViewDrawer
                    drawerProps={drawerProps}
                    stack={stack}
                    view={view}
                    onViewChange={onViewChange}
                />
            </Drawer.Stack>

            <div className="personal-notes-controls">
                <Indicator
                    styles={{
                        root: {
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }
                    }}
                    h="auto"
                    disabled={!isFiltered}
                    size={7}
                    color="blue"
                    offset={4}
                    zIndex={2}
                >
                    <ActionIcon
                        h="auto"
                        color="rgb(5, 5, 73)"
                        variant="subtle"
                        onClick={() => stack.open("options")}
                        styles={{
                            root: {

                                alignSelf: "center"
                            }
                        }}
                    >
                        <IoOptions size="1.5rem" color="rgb(5, 5, 73)" />
                    </ActionIcon>
                </Indicator>
            </div>
        </>
    );
};