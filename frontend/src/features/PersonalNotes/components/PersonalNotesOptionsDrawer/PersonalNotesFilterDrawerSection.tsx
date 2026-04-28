import { Text } from "@mantine/core";
import type { ReactNode } from "react";

type Props = {
    label: string;
    body: ReactNode;
}

export const PersonalNotesFilterDrawerSection = ({ label, body }: Props) => {
    return (
        <div className="personal-notes-filter-drawer-section">
            <div className="personal-notes-filter-drawer-section--body">
                {body}
            </div>
        </div>
    )
}