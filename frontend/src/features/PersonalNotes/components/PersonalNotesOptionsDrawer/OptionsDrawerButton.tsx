import type { ReactNode } from "react";
import { ChevronRightIcon } from "lucide-react";

type Props = {
    /** Icon that sits on left of label */
    icon: ReactNode;
    /** Button label */
    title: string;
    /** Selected option */
    activeOption: string;
    /** Button's click handler */
    onClick: () => void;
}

/** Button in options drawer (Sort by, Filters, or View) */
export const OptionsDrawerButton = ({ icon, title, activeOption, onClick }: Props) => {
    return (
        <button className="notes-options-drawer-btn" onClick={onClick}>
            <div className="notes-options-drawer-btn--left">
                <div className="notes-options-drawer-btn--icon">{icon}</div>
                <span className="notes-options-drawer-btn--title">{title}</span>
            </div>
            <div className="notes-options-drawer-btn--right">
                <div className="notes-options-drawer-btn--active">{activeOption}</div>
                <ChevronRightIcon size="1rem" color="var(--mantine-color-gray-7)" />
            </div>
        </button>
    )
}