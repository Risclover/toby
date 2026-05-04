import { Drawer, useModalsStack, type DrawerProps } from "@mantine/core";
import { NotesViewSelector } from "./NotesViewSelector";
import type { ViewOption } from "../../hooks";

type Props = {
    /** Props for drawer component */
    drawerProps: DrawerProps;
    /** Drawer stack instance, for usage inside `Drawer.Stack`. */
    stack: ReturnType<typeof useModalsStack>;
    /** Active view option */
    view: ViewOption;
    /** Handler for when user changes active view option */
    onViewChange: (val: ViewOption) => void;
}

/** 'View' options drawer, where user can see skeleton previews of each view, and switch between them (grid and list views). */
export const PersonalNotesViewDrawer = ({ drawerProps, stack, view, onViewChange }: Props) => {
    return (
        <Drawer title="View" {...drawerProps} {...stack.register("view")}>
            <NotesViewSelector activeView={view} setActiveView={onViewChange} />
        </Drawer>
    )
}