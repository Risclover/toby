import { useAuthenticateQuery } from "@/store/authSlice";
import { useGetHouseholdQuery } from "@/store/householdSlice";
import { ActionIcon, CloseButton, Combobox, Input, InputBase, Tooltip, useCombobox } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks";
import FilterAltRoundedIcon from '@mui/icons-material/FilterAltRounded';
import { type SortOption, type TaskFilters } from "../../hooks/useTasklistFiltering";
import { MobileTasklistFilterDrawer } from "./MobileTasklistFilterDrawer";
import { ReorderListIcon } from "@/assets/icons/ReorderListIcon";
import { useEffect } from "react";
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { useIsSmallScreen } from "@/hooks/useIsSmallScreen";
import { useReorderTasksMutation, useUpdateTasklistMutation, type Task, type TasklistType } from "@/store/taskSlice";

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
    const { data: household } = useGetHouseholdQuery(user?.householdId);
    const isSmall = useIsSmallScreen();
    const [reorderTasks] = useReorderTasksMutation(); // Assuming you have this in your Redux slice
    const [updateTasklist] = useUpdateTasklistMutation();
    const canReorder = currentSort.toLowerCase() === 'manual' && !tasklist?.isArchived;

    const optionsList = [
        { value: "due_date", label: "Due date" },
        { value: "importance", label: "Importance" },
        { value: "alphabetical", label: "Alphabetical" },
        { value: "newest", label: "Newest" },
        { value: 'oldest', label: "Oldest" },
        { value: 'manual', label: "Manual" }
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
        if (!val) return; // 🚀 Block empty submissions
        // 1. Close dropdown immediately for better UX
        combobox.closeDropdown();

        if (val === 'manual') {
            try {
                const orderedIds = filteredTasks.map(t => t.id);

                // 2. Call the backend
                await reorderTasks({
                    listId,
                    orderedIds,
                    setToManual: true
                }).unwrap(); // .unwrap() ensures it throws an error if the API fails

                // 3. Update the temporary UI state ONLY after success
                setSortOption(val as any);
            } catch (error) {
                console.error("Failed to switch to manual:", error);
                // Optional: Show a toast/notification here
            }
        } else {
            // Normal behavior for other sort modes
            setSortOption(val as any);
        }
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
                            onClick={() => combobox.toggleDropdown()}
                            rightSection={<Combobox.Chevron />}
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
                    {isSmall && filteredTasks?.length > 1 && tasks?.length > 1 && canReorder && <Tooltip label={showReorderMode ? "Close reorder mode" : "Reorder list"}>
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