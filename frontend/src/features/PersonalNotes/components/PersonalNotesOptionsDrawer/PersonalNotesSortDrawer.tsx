import { Button, CheckIcon, Drawer, Radio, Text } from "@mantine/core";
import type { SortOption } from "../../hooks/useNotesFilter";
import { FaCheck } from "react-icons/fa6";
import { useState } from "react";
import { useNotesFilterContext } from "@/contexts/NotesFilterContext";

type Props = {
    stack: any;
    drawerProps: any;
    sort: SortOption;
    onSortChange: (val: SortOption) => void;
};

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: "newest", label: "Newest first" },
    { value: "oldest", label: "Oldest first" },
    { value: "alpha", label: "A → Z" },
    { value: "category_alpha", label: "By category" },
    { value: "private_first", label: "Private first" },
];

export const PersonalNotesSortDrawer = ({ stack, drawerProps, sort, onSortChange }: Props) => {
    const { filters, isFiltered, updateFilters, saveDefaults } = useNotesFilterContext();
    const [saved, setSaved] = useState(false);
    const handleSaveDefaults = () => {
        saveDefaults();
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <Drawer
            title="Sort by"
            {...drawerProps}
            {...stack.register("sort")}
        >
            <Radio.Group value={sort} onChange={(val) => onSortChange(val as SortOption)}>
                <div className="sort-options-list">
                    {SORT_OPTIONS.map(option => (
                        <div
                            key={option.value}
                            className="sort-option"
                            onClick={() => onSortChange(option.value)}
                        >
                            <Radio
                                color="rgb(5, 5, 73)"
                                icon={CheckIcon}
                                value={option.value}
                                label={option.label}
                                labelPosition="left"
                                onClick={(e) => e.stopPropagation()} // prevent double-firing
                                styles={{
                                    root: {
                                        width: "100%",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        height: "100%",
                                        padding: ".5rem .25rem",
                                        fontFamily: "var(--font-family-sora)"
                                    },
                                    body: {
                                        width: "100%",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        fontWeight: 400
                                    }
                                }}
                            />
                        </div>
                    ))}
                </div>
            </Radio.Group>
            {/* <div className="notes-save-defaults">
                <Button
                    variant="light"
                    color="rgb(5, 5, 73)"
                    size="sm"
                    fullWidth
                    onClick={handleSaveDefaults}
                    leftSection={saved ? <FaCheck size=".75rem" /> : undefined}
                >
                    {saved ? "Saved!" : "Save View & Sort As Default"}
                </Button>
                <Text size="xs" c="dimmed" ta="center" mt={4}>
                    Does not save active filters.
                </Text>
            </div> */}
        </Drawer>
    );
};