import type { ReactNode } from "react";

type Props = {
    /** Body of section */
    body: ReactNode;
}

/** Presentational component, section of the filters drawer */
export const PersonalNotesFilterDrawerSection = ({ body }: Props) => {
    return (
        <div className="personal-notes-filter-drawer-section">
            <div className="personal-notes-filter-drawer-section--body">
                {body}
            </div>
        </div>
    )
}