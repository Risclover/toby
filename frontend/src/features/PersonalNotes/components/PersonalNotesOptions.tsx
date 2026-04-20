import { FloatingIndicator, UnstyledButton } from "@mantine/core";
import { useRef, useState } from "react";
import classes from "../styles/Demo.module.css";
import { ListViewIcon } from "@/assets/icons/ListViewIcon";
import { GridViewIcon } from "@/assets/icons/GridViewIcon";

export type NotesView = "board" | "list";

const VIEW_OPTIONS: { value: NotesView; icon: React.ReactNode }[] = [
    { value: "board", icon: <GridViewIcon size="1rem" color="rgb(5, 5, 73)" /> },
    { value: "list", icon: <ListViewIcon size="1rem" color="rgb(5, 5, 73)" /> },
];

type Props = {
    view: NotesView;
    onViewChange: (val: NotesView) => void;
    onCreateNote: () => void;
}

export const PersonalNotesOptions = ({ view, onViewChange, onCreateNote }: Props) => {
    const [rootRef, setRootRef] = useState<HTMLDivElement | null>(null);
    const controlsRefs = useRef<Record<string, HTMLButtonElement | null>>({});

    const setControlRef = (val: string) => (node: HTMLButtonElement | null) => {
        controlsRefs.current[val] = node;
    };


    return (
        <div className={classes.container}>
            <div className={classes.root} ref={setRootRef}>
                <FloatingIndicator
                    target={controlsRefs.current[view]}
                    parent={rootRef}
                    className={classes.indicator}
                />
                <div className={classes.controlsGroup}>
                    {VIEW_OPTIONS.map(item => (
                        <UnstyledButton
                            key={item.value}
                            ref={setControlRef(item.value)}
                            onClick={() => onViewChange(item.value)}
                            className={classes.control}
                            data-active={item.value === view || undefined}
                        >
                            <span className={classes.controlLabel}>{item.icon}</span>
                        </UnstyledButton>
                    ))}
                </div>
            </div>
        </div>
    );
};