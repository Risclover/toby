import { Drawer } from "@mantine/core";
import type { ViewOption } from "../../hooks/useNotesFilter"
import { NotesViewSelector } from "./NotesViewSelector";

type Props = {
    drawerProps: any;
    stack: any;
    view: ViewOption;
    onViewChange: (val: ViewOption) => void;
}

export const PersonalNotesViewDrawer = ({ drawerProps, stack, view, onViewChange }: Props) => {
    return (
        <Drawer title="View" {...drawerProps} {...stack.register("view")}>
            <NotesViewSelector activeView={view} setActiveView={onViewChange} />
        </Drawer>
    )
}