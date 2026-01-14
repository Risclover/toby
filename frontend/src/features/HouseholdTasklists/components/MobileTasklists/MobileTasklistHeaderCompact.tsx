import { useAuthenticateQuery } from "@/store/authSlice";
import { useGetHouseholdQuery } from "@/store/householdSlice";
import { Button, CloseButton, Combobox, Input, InputBase, TextInput, useCombobox } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks";
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import FilterAltRoundedIcon from '@mui/icons-material/FilterAltRounded';
import { type SortOption, type TaskFilters } from "../../hooks/useTasklistFiltering";
import { MobileTasklistFilterDrawer } from "./MobileTasklistFilterDrawer";
import { ReorderListIcon } from "@/assets/icons/ReorderListIcon";

interface Props {
    // Lift state up! Pass these down from the Page component
    searchValue: string;
    setSearchValue: (val: string) => void;
    sortOption: SortOption;
    setSortOption: (val: SortOption) => void;
    filters: TaskFilters;
    setFilters: (val: TaskFilters) => void;
}

export const MobileTasklistHeaderCompact = ({ searchValue, setSearchValue, sortOption, setSortOption, filters, setFilters }: Props) => {
    const combobox = useCombobox();
    const [opened, { open, close }] = useDisclosure(false);
    const { data: user } = useAuthenticateQuery();
    const { data: household } = useGetHouseholdQuery(user?.householdId);

    return (
        <div className="mobile-announcements-header">
            <Button styles={{ root: { minWidth: "54px" } }} variant="light" size="sm" color="rgb(5, 5, 73)"><ReorderListIcon /></Button>
            <Button onClick={open} styles={{ root: { minWidth: "54px" } }} variant="light" size="sm" color="rgb(5, 5, 73)">
                <FilterAltRoundedIcon />
            </Button>
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