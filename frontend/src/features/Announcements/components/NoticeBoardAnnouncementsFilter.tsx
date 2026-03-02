import { type SetStateAction } from "react"
import { FloatingIndicator } from "@mantine/core";
import { useNoticeBoardAnnouncementsFilter } from "../hooks/useNoticeBoardAnnouncementsFilter";
import classes from "../styles/NoticeBoardAnnouncements.module.css";

export const NoticeBoardAnnouncementsFilter = ({ setImportanceFilter }: { setImportanceFilter: React.Dispatch<SetStateAction<boolean>> }) => {
    const {
        rootRef,
        setRootRef,
        controls,
        controlsRefs,
        active
    } = useNoticeBoardAnnouncementsFilter({ setImportanceFilter });

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