import { ActionIcon, Drawer, Indicator, useModalsStack } from "@mantine/core";

import { OptionsDrawerButton } from "./OptionsDrawerButton";
import { PersonalNotesSortDrawer } from "./PersonalNotesSortDrawer";
import { PersonalNotesFilterDrawer } from "./PersonalNotesFilterDrawer";
import { PersonalNotesViewDrawer } from "./PersonalNotesViewDrawer";
import { usePersonalNotesOptionsDrawer, type SortOption, type ViewOption } from "../../hooks";

import { IoOptions } from "react-icons/io5";

type Props = {
    /** Active sort option */
    sort: SortOption;
    /** Handler for when user changes active sort */
    onSortChange: (val: SortOption) => void;
    /** Active view option */
    view: ViewOption;
    /** Handler for when user changes active view */
    onViewChange: (val: ViewOption) => void;
};

/** 
 * Options drawer, which serves as the first "page" before user goes into sort, filter, or view options
 */
export const PersonalNotesOptionsDrawer = ({ sort, onSortChange, view, onViewChange }: Props) => {
    const {
        stack,
        isFiltered,
        optionsDrawerButtons,
        drawerProps
    } = usePersonalNotesOptionsDrawer({ sort, view });

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
                    stack={stack as ReturnType<typeof useModalsStack>}
                    sort={sort}
                    onSortChange={onSortChange}
                />
                <PersonalNotesFilterDrawer
                    drawerProps={drawerProps}
                    stack={stack as ReturnType<typeof useModalsStack>}
                />
                <PersonalNotesViewDrawer
                    drawerProps={drawerProps}
                    stack={stack as ReturnType<typeof useModalsStack>}
                    view={view}
                    onViewChange={onViewChange}
                />
            </Drawer.Stack>

            {/* Button that opens options drawer */}
            <div className="personal-notes-controls">
                {/* Indicator turns on when a filter is active */}
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