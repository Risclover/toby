import { Button, CloseButton, Combobox, Input, InputBase, TextInput, useCombobox } from '@mantine/core';
import FilterAltRoundedIcon from '@mui/icons-material/FilterAltRounded';
import React, { useState, type SetStateAction } from 'react';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { MobileAnnouncementsFilterDrawer } from './MobileAnnouncementsFilterDrawer';
import { useDisclosure } from '@mantine/hooks';
import { useGetHouseholdQuery } from '@/store/householdSlice';
import { useAuthenticateQuery } from '@/store/authSlice';

type Props = {
    searchValue: string;
    setSearchValue: React.Dispatch<SetStateAction<string>>;
    sortOption: "Newest" | "Oldest" | "Important first" | null;
    setSortOption: React.Dispatch<SetStateAction<"Newest" | "Oldest" | "Important first" | null>>;
    filters: {
        importance: "all" | "important";
        creatorId: number | null;
        time: "today" | "7days" | "30days" | "all";
    };
    setFilters: React.Dispatch<SetStateAction<{
        importance: "all" | "important";
        creatorId: number | null;
        time: "today" | "7days" | "30days" | "all";
    }>>;
}
export const MobileAnnouncementsHeader = ({ searchValue, setSearchValue, sortOption, setSortOption, filters, setFilters }: Props) => {
    const combobox = useCombobox();
    const [opened, { open, close }] = useDisclosure(false);
    const [value, setValue] = useState<string | null>(null);
    const { data: user } = useAuthenticateQuery();
    const { data: household } = useGetHouseholdQuery(user?.householdId)

    const optionsList = ["Newest", "Oldest", "Important first"];
    const options = optionsList.map(item => <Combobox.Option value={item} key={item}>{item}</Combobox.Option>)

    return (
        <div className="mobile-announcements-header">
            <TextInput
                value={searchValue}
                onChange={(e) => setSearchValue(e.currentTarget.value)}
                styles={{ root: { width: "100%" }, input: { width: "100%" } }}
                className="announcements-search"
                size="xs"
                placeholder="Search announcements"
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
            />
            <Combobox size="xs" store={combobox} onOptionSubmit={(val) => {
                setSortOption(val as any);
                combobox.closeDropdown();
            }}
            >
                <Combobox.Target>
                    <InputBase
                        className="announcements-sort"
                        size="xs"
                        component="button"
                        type="button"
                        pointer
                        rightSection={
                            sortOption ? (
                                <CloseButton
                                    size="sm"
                                    onMouseDown={(event) => event.preventDefault()}
                                    onClick={() => setSortOption(null)}
                                    aria-label="Clear value"
                                />
                            ) : (
                                <Combobox.Chevron />
                            )
                        }
                        onClick={() => combobox.toggleDropdown()}
                        rightSectionPointerEvents={sortOption === null ? 'none' : 'all'}
                    >
                        {sortOption || <Input.Placeholder>Sort by</Input.Placeholder>}
                    </InputBase>
                </Combobox.Target>
                <Combobox.Dropdown>
                    <Combobox.Options>{options}</Combobox.Options>
                </Combobox.Dropdown>
            </Combobox>
            <Button onClick={open} styles={{ root: { minWidth: "54px" } }} variant="light" size="xs" color="rgb(5, 5, 73)"><FilterAltRoundedIcon /></Button>
            <MobileAnnouncementsFilterDrawer
                opened={opened}
                close={close}
                householdMembers={household?.members}
                filters={filters}
                setFilters={setFilters}
            />
        </div>
    )
}