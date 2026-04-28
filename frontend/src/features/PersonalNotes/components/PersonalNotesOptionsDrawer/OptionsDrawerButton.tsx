import { ChevronRightIcon } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
    icon: ReactNode;
    title: string;
    activeOption: string;
    onClick: () => void;
}

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