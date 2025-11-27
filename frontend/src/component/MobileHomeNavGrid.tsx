import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import ShoppingCartRoundedIcon from "@mui/icons-material/ShoppingCartRounded";
import EditCalendarRoundedIcon from "@mui/icons-material/EditCalendarRounded";
import { useState, type JSX } from "react";

type Item = {
    href: string;
    label: string;
    icon: JSX.Element;
    ariaLabel?: string;
};

export const MobileHomeNavGrid = () => {
    const [activeIndex, setActiveIndex] = useState(0);

    const items: Item[] = [
        { href: "/tasklists", label: "Home", ariaLabel: "Home", icon: <AssignmentTurnedInRoundedIcon /> },
        { href: "/tasklists", label: "Tasks", ariaLabel: "Tasks", icon: <AssignmentTurnedInRoundedIcon /> },
        { href: "#", label: "Calendar", ariaLabel: "Calendar", icon: <EditCalendarRoundedIcon /> },
        { href: "/shopping", label: "Shopping", ariaLabel: "Shopping Lists", icon: <ShoppingCartRoundedIcon /> },
    ];

    return (
        <div className="mobile-home-nav-grid">
            {items.map((btn, index) => (
                <MobileHomeNavGridBtn
                    key={btn.href + index}
                    btn={btn}
                    index={index}
                    activeIndex={activeIndex}
                    setActiveIndex={setActiveIndex}
                />
            ))}
        </div>
    );
};

type BtnProps = {
    btn: Item;
    index: number;
    activeIndex: number;
    setActiveIndex: (i: number) => void;
};

const MobileHomeNavGridBtn = ({ btn, index, activeIndex, setActiveIndex }: BtnProps) => {
    const isActive = activeIndex === index;

    return (
        <div
            className={`mobile-home-nav-grid-btn ${isActive ? "active" : ""}`}
            role="button"
            tabIndex={0}
            aria-label={btn.ariaLabel ?? btn.label}
            aria-current={isActive ? "page" : undefined}
            onClick={() => {
                setActiveIndex(index);
                // optionally navigate:
                // window.location.href = btn.href;
            }}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveIndex(index);
                }
            }}
        >
            <div className="mobile-home-nav-grid-btn-icon-container">{btn.icon}</div>
            <span>{btn.label}</span>
        </div>
    );
};
