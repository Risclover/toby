import { useState } from "react";
import { UnstyledButton } from "@mantine/core";
import { StarIcon } from "@/assets";
import classes from "../styles/NoticeBoardAnnouncements.module.css";

type Props = {
    setImportanceFilter: (val: boolean) => void;
}

export const useNoticeBoardAnnouncementsFilter = ({ setImportanceFilter }: Props) => {
    const [rootRef, setRootRef] = useState<HTMLDivElement | null>(null);
    const [controlsRefs, setControlsRefs] = useState<Record<string, HTMLButtonElement | null>>({});
    const [active, setActive] = useState(0);

    const setControlRef = (val: number) => (node: HTMLButtonElement) => {
        controlsRefs[val] = node;
        setControlsRefs(controlsRefs);
    };

    const importantTab = (
        <div className={classes.important}>
            <StarIcon color="rgb(230, 176, 2)" size="18px" />
            Important
        </div>
    );

    const OPTIONS = [
        "All",
        importantTab
    ]

    const controls = OPTIONS.map((item, index) => (
        <UnstyledButton
            className={classes.control}
            ref={setControlRef(index)}
            onClick={() => {
                setActive(index);
                setImportanceFilter(index === 1);
            }}
            mod={{ active: active === index }}
        >
            <span className={classes.controlLabel}>{item}</span>
        </UnstyledButton>
    ));

    return {
        rootRef,
        setRootRef,
        controls,
        controlsRefs,
        active
    }
}