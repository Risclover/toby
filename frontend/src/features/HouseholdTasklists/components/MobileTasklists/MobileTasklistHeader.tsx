import { useAuthenticateQuery } from "@/store/authSlice";
import { useGetHouseholdQuery } from "@/store/householdSlice";
import { ActionIcon, CloseButton, Combobox, Input, InputBase, Tooltip, useCombobox } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks";
import FilterAltRoundedIcon from '@mui/icons-material/FilterAltRounded';
import { type SortOption, type TaskFilters } from "../../hooks/useTaskFiltering";
import { MobileTasklistFilterDrawer } from "./MobileTasklistFilterDrawer";
import { ReorderListIcon } from "@/assets/icons/ReorderListIcon";
import { useEffect } from "react";
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { useIsSmallScreen } from "@/hooks/useIsSmallScreen";
import { useReorderTasksMutation, useUpdateTasklistMutation, type Task, type TasklistType } from "@/store/taskSlice";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useHousehold } from "@/hooks/useHousehold";

interface Props {
    // Lift state up! Pass these down from the Page component
    searchValue: string;
    setSearchValue: (val: string) => void;
    sortOption: SortOption;
    setSortOption: (val: SortOption) => void;
    filters: TaskFilters;
    setFilters: (val: TaskFilters) => void;
    showReorderMode: boolean;
    setShowReorderMode: (val: boolean | ((prev: boolean) => boolean)) => void;
    tasks: Task[];
    filteredTasks: Task[];
    listId: number;
    currentSort: string;
    tasklist: TasklistType;
}

export const MobileTasklistHeader = ({ sortOption, setSortOption, filters, setFilters, showReorderMode, setShowReorderMode, tasks, filteredTasks, listId, currentSort, tasklist }: Props) => {
    const combobox = useCombobox();
    const [opened, { open, close }] = useDisclosure(false);
    const { data: user } = useAuthenticateQuery();
    const { data: household } = useHousehold();
    const isSmall = useIsSmallScreen();
    const isMobile = useIsMobile();
    const [reorderTasks] = useReorderTasksMutation(); // Assuming you have this in your Redux slice
    const [updateTasklist] = useUpdateTasklistMutation();
    const canReorder = currentSort?.toLowerCase() === 'manual' && !tasklist?.isArchived;

    const optionsList = [
        { value: 'manual', label: "Manual" },
        { value: "due_date", label: "Due date" },
        { value: "importance", label: "Importance" },
        { value: "alphabetical", label: "Alphabetical" },
        { value: "newest", label: "Newest" },
        { value: 'oldest', label: "Oldest" },
    ];

    const activeValue = sortOption || tasklist?.defaultSortOrder || 'manual';
    const selectedOption = optionsList.find(o => o.value === activeValue);

    // Inside the InputBase
    { selectedOption ? selectedOption.label : "Manual" }

    // 2. Map options for the dropdown (Same as before)
    const options = optionsList.map(item => (
        <Combobox.Option value={item.value} key={item.value}>
            {item.label}
        </Combobox.Option>
    ));

    const handleSortChange = async (val: string) => {
        // 1. Update local UI state immediately so the list resorts
        setSortOption(val as any);

        // 2. Persist the change to the database
        // This ensures tasklist.defaultSortOrder becomes 'manual'
        try {
            await updateTasklist({
                id: listId,
                defaultSortOrder: val
            }).unwrap();
        } catch (err) {
            console.error("Failed to update default sort order:", err);
        }

        // 3. Clean up UI
        if (val !== 'manual') {
            setShowReorderMode(false);
        }
        combobox.closeDropdown();
    };


    return (
        <div className="mobile-tasklist-header">
            {/* <TextInput
                value={searchValue}
                onChange={(e) => setSearchValue(e.currentTarget.value)}
                styles={{ root: { width: "100%" }, input: { width: "100%" } }}
                className="tasklist-search"
                size="xs"
                placeholder="Search tasks"
                leftSection={<SearchRoundedIcon />}
                rightSection={searchValue !== "" ?
                    <CloseButton
                        size="sm"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setSearchValue("")}
                        aria-label="Clear search value"
                    />
                    : null
                }
            /> */}
            <div className="tasklist-header-right">

            </div>
            <div className="tasklist-header-left">
                <Combobox
                    size="xs"
                    store={combobox}
                    onOptionSubmit={handleSortChange}
                >
                    <Combobox.Target>
                        <InputBase
                            className="tasklists-sort"
                            size="xs"
                            component="button"
                            type="button"
                            pointer
                            defaultValue="manual"
                            onClick={() => combobox.toggleDropdown()}
                            rightSectionPointerEvents={sortOption === "" ? 'none' : 'all'}
                            rightSection={
                                sortOption !== "manual" ? (
                                    <CloseButton
                                        size="sm"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={(e) => {
                                            e.stopPropagation(); // Good practice to stop bubbling
                                            handleSortChange("manual");
                                        }}
                                        aria-label="Clear sort option"
                                    />
                                ) : (
                                    <Combobox.Chevron />
                                )
                            }
                        >
                            {/* 3. Render the Label if found, otherwise the placeholder */}
                            {selectedOption ? selectedOption.label : <Input.Placeholder>Sort by</Input.Placeholder>}
                        </InputBase>
                    </Combobox.Target>

                    <Combobox.Dropdown>
                        <Combobox.Options>{options}</Combobox.Options>
                    </Combobox.Dropdown>
                </Combobox>
                <Tooltip.Group openDelay={500} closeDelay={100}>
                    <Tooltip label="Filter list"><ActionIcon onClick={open} variant="subtle" color="rgb(5, 5, 73)">
                        <FilterAltRoundedIcon />
                    </ActionIcon></Tooltip>
                    {(isSmall || isMobile) && filteredTasks?.length > 1 && tasks?.length > 1 && canReorder && <Tooltip label={showReorderMode ? "Close reorder mode" : "Reorder list"}>
                        <ActionIcon
                            onClick={() => setShowReorderMode(prev => !prev)}
                            variant={showReorderMode ? "light" : "subtle"}
                            color="rgb(5, 5, 73)"
                            aria-label="Reorder list"
                        >
                            {!showReorderMode ? <ReorderListIcon /> : <CloseRoundedIcon />}
                        </ActionIcon>
                    </Tooltip>}
                </Tooltip.Group>
            </div>
            <MobileTasklistFilterDrawer
                opened={opened}
                close={close}
                householdMembers={household?.members}
                filters={filters}
                setFilters={setFilters}
                listId={listId}
            />
        </div>
    )
}