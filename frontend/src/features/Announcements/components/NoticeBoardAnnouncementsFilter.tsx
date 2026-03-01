import { FloatingIndicator, UnstyledButton } from "@mantine/core";
import { useEffect, useState, type SetStateAction } from "react"
import { StarIcon } from "@/assets";
import classes from "../styles/NoticeBoardAnnouncements.module.css";
import type { Dispatch } from "redux";

const importantTab = <div className={classes.important}><StarIcon color="rgb(230, 176, 2)" size="18px" /> Important</div>
const OPTIONS = [
    "All",
    importantTab
]

export const NoticeBoardAnnouncementsFilter = ({ setImportanceFilter }: { setImportanceFilter: React.Dispatch<SetStateAction<boolean>> }) => {
    const [rootRef, setRootRef] = useState<HTMLDivElement | null>(null);
    const [controlsRefs, setControlsRefs] = useState<Record<string, HTMLButtonElement | null>>({});
    const [active, setActive] = useState(0);

    const setControlRef = (val: number) => (node: HTMLButtonElement) => {
        controlsRefs[val] = node;
        setControlsRefs(controlsRefs);
    };

    useEffect(() => {
        setImportanceFilter(active === 1);
        console.log('active:', active);
    }, [active])


    const controls = OPTIONS.map((item, index) => (
        <UnstyledButton
            className={classes.control}
            ref={setControlRef(index)}
            onClick={() => setActive(index)}
            mod={{ active: active === index }}
        >
            <span className={classes.controlLabel}>{item}</span>
        </UnstyledButton>
    ));

    return (
        <div className={classes.container}>
            <div className={classes.root} ref={setRootRef}>
                <FloatingIndicator
                    target={controlsRefs[active]}
                    parent={rootRef}
                    className={classes.indicator}
                />
                <div className={classes.controlsGroup}>
                    {controls}
                </div>
            </div>
        </div>
    );
}