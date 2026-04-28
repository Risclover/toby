import { Button, FloatingIndicator, Tooltip, UnstyledButton } from "@mantine/core";
import { useRef, useState } from "react";
import classes from "../styles/Demo.module.css";
import { ListViewIcon } from "@/assets/icons/ListViewIcon";
import { GridViewIcon } from "@/assets/icons/GridViewIcon";
import { PersonalNotesFilterDrawer } from "./PersonalNotesFilterDrawer";
import { getLightColor } from "@/utils/getLightColor";

export type NotesView = "grid" | "list";

const VIEW_OPTIONS: { value: NotesView; tooltip: string; icon: React.ReactNode }[] = [
    { value: "grid", tooltip: "Grid view", icon: <Tooltip label="Grid view"><GridViewIcon size="1rem" color="rgb(5, 5, 73)" /></Tooltip> },
    { value: "list", tooltip: "List view", icon: <ListViewIcon size="1rem" color="rgb(5, 5, 73)" /> },
];

type Props = {
    view: NotesView;
    onViewChange: (val: NotesView) => void;
}

export const PersonalNotesViewOptions = ({ view, onViewChange }: Props) => {
    const [rootRef, setRootRef] = useState<HTMLDivElement | null>(null);
    const [showFilterDrawer, setShowFilterDrawer] = useState(false);
    const controlsRefs = useRef<Record<string, HTMLButtonElement | null>>({});

    const setControlRef = (val: string) => (node: HTMLButtonElement | null) => {
        controlsRefs.current[val] = node;
    };


    return (
        <div className={classes.container}>
            <div style={{ background: "rgba(5, 5, 73, 0.1)" }} className={classes.root} ref={setRootRef}>
                <FloatingIndicator
                    target={controlsRefs.current[view]}
                    parent={rootRef}
                    className={classes.indicator}
                />
                <div className={classes.controlsGroup}>
                    <Tooltip.Group openDelay={500} closeDelay={100}>
                        {VIEW_OPTIONS.map(item => (
                            <Tooltip withArrow label={item.tooltip} events={{ hover: true, focus: true, touch: false }} openDelay={500} closeDelay={100} >
                                <UnstyledButton
                                    key={item.value}
                                    ref={setControlRef(item.value)}
                                    onClick={() => onViewChange(item.value)}
                                    className={classes.control}
                                    data-active={item.value === view || undefined}
                                >
                                    <span className={classes.controlLabel}>{item.icon}</span>
                                </UnstyledButton></Tooltip>
                        ))}
                    </Tooltip.Group>
                </div>
            </div>
        </div>
    );
};