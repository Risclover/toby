import { Button, CloseButton, Combobox, Input, InputBase, TextInput, useCombobox } from '@mantine/core';
import FilterAltRoundedIcon from '@mui/icons-material/FilterAltRounded';
import React, { useState, type SetStateAction } from 'react';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';

type Props = {
    searchValue: string;
    setSearchValue: React.Dispatch<SetStateAction<string>>;
}
export const MobileAnnouncementsHeader = ({ searchValue, setSearchValue }: Props) => {
    const combobox = useCombobox();

    const [value, setValue] = useState<string | null>(null);

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
                setValue(val);
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
                            value !== null ? (
                                <CloseButton
                                    size="sm"
                                    onMouseDown={(event) => event.preventDefault()}
                                    onClick={() => setValue(null)}
                                    aria-label="Clear value"
                                />
                            ) : (
                                <Combobox.Chevron />
                            )
                        }
                        onClick={() => combobox.toggleDropdown()}
                        rightSectionPointerEvents={value === null ? 'none' : 'all'}
                    >
                        {value || <Input.Placeholder>Sort by</Input.Placeholder>}
                    </InputBase>
                </Combobox.Target>
                <Combobox.Dropdown>
                    <Combobox.Options>{options}</Combobox.Options>
                </Combobox.Dropdown>
            </Combobox>
            <Button styles={{ root: { minWidth: "54px" } }} variant="light" size="xs" color="rgb(5, 5, 73)"><FilterAltRoundedIcon /></Button>
        </div>
    )
}