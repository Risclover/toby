import { useAuthenticateQuery } from "@/store/authSlice";
import { useGetHouseholdQuery } from "@/store/householdSlice";
import { ActionIcon, Button, CloseButton, Combobox, Input, InputBase, TextInput, Tooltip, useCombobox } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks";
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import FilterAltRoundedIcon from '@mui/icons-material/FilterAltRounded';
import { type SortOption, type TaskFilters } from "../../hooks/useTasklistFiltering";
import { MobileTasklistFilterDrawer } from "./MobileTasklistFilterDrawer";
import { ReorderListIcon, ReorderListIconCyan } from "@/assets/icons/ReorderListIcon";
import { useEffect } from "react";
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

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
}

export const MobileTasklistHeader = ({ searchValue, setSearchValue, sortOption, setSortOption, filters, setFilters, showReorderMode, setShowReorderMode }: Props) => {
    const combobox = useCombobox();
    const [opened, { open, close }] = useDisclosure(false);
    const { data: user } = useAuthenticateQuery();
    const { data: household } = useGetHouseholdQuery(user?.householdId);

    const optionsList: SortOption[] = [
        "Due Date",
        "Importance",
        "Alphabetical",
        "Newest",
    ];

    useEffect(() => {
        console.log('reorderMode:', showReorderMode);
    }, [showReorderMode])

    const options = optionsList.map(item => {
        return (
            <Combobox.Option value={item} key={item}>
                {item}
            </Combobox.Option>
        );
    });

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
                <Combobox size="xs" store={combobox} onOptionSubmit={(val) => {
                    setSortOption(val as any);
                    combobox.closeDropdown();
                }}
                >
                    <Combobox.Target>
                        <InputBase
                            className="tasklists-sort"
                            size="xs"
                            component="button"
                            type="button"
                            pointer
                            onClick={() => combobox.toggleDropdown()}
                            rightSectionPointerEvents={sortOption === "" ? 'none' : 'all'}
                            rightSection={
                                sortOption ? (
                                    <CloseButton
                                        size="sm"
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                        }}
                                        onClick={() => {
                                            setSortOption("");
                                        }}
                                        aria-label="Clear sort option"
                                    />
                                ) : (
                                    <Combobox.Chevron />
                                )
                            }
                        >{sortOption || <Input.Placeholder>Sort by</Input.Placeholder>}</InputBase>
                    </Combobox.Target>
                    <Combobox.Dropdown>
                        <Combobox.Options>{options}</Combobox.Options>
                    </Combobox.Dropdown>
                </Combobox>
                <Tooltip.Group openDelay={500} closeDelay={100}>
                    <Tooltip label="Filter list"><ActionIcon onClick={open} variant="subtle" color="rgb(5, 5, 73)">
                        <FilterAltRoundedIcon />
                    </ActionIcon></Tooltip>
                    <Tooltip label="Reorder list">
                        <ActionIcon
                            onClick={() => setShowReorderMode(prev => !prev)}
                            variant={showReorderMode ? "light" : "subtle"}
                            color="rgb(5, 5, 73)"
                            aria-label="Reorder list"
                            title={showReorderMode ? "Close reorder mode" : "Reorder list"}
                        >
                            {!showReorderMode ? <ReorderListIcon /> : <CloseRoundedIcon />}
                        </ActionIcon>
                    </Tooltip>
                </Tooltip.Group>
            </div>
            <MobileTasklistFilterDrawer
                opened={opened}
                close={close}
                householdMembers={household?.members}
                filters={filters}
                setFilters={setFilters}
            />
        </div>
    )
}