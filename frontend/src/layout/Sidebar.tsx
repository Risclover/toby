import { useEffect, useState, type JSX } from "react";
import { TobyIcon } from "@/assets/icons/TobyIcon";
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded';
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import EditCalendarRoundedIcon from '@mui/icons-material/EditCalendarRounded';
import "./Sidebar.css";
import { Avatar, Tooltip } from "@mantine/core";
import { useAuthenticateQuery } from "@/store/authSlice";
import { useGetHouseholdQuery } from "@/store/householdSlice";
import { useNavigate } from "react-router-dom";
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';

type Item = {
    href: string;
    label: string;
    icon: JSX.Element;
    ariaLabel?: string;
};

const items: Item[] = [
    {
        href: "/",
        label: "Dashboard",
        ariaLabel: "Dashboard",
        icon: (
            <GridViewRoundedIcon />
        ),
    },
    {
        href: "/tasklists",
        label: "Tasks",
        ariaLabel: "Tasks",
        icon: (
            <AssignmentTurnedInRoundedIcon />
        ),
    },
    {
        href: "#",
        label: "Calendar",
        ariaLabel: "Calendar",
        icon: (
            <EditCalendarRoundedIcon />
        ),
    },
    {
        href: "#",
        label: "Projects",
        ariaLabel: "Projects",
        icon: (
            <Inventory2RoundedIcon />
        )
    },
    {
        href: "/shopping",
        label: "Shopping Lists",
        ariaLabel: "Shopping Lists",
        icon: (
            <ShoppingCartRoundedIcon />
        )
    },
    // {
    //     href: "#",
    //     label: "Settings",
    //     ariaLabel: "Settings",
    //     icon: (
    //         <SettingsRoundedIcon />
    //     ),
    // },
];

export default function Sidebar() {
    const navigate = useNavigate();
    const { data: user } = useAuthenticateQuery();
    const { data: household } = useGetHouseholdQuery(user?.householdId)
    const [collapsed, setCollapsed] = useState<boolean>(() => {
        try { return localStorage.getItem("sidebar-collapsed") === "1"; }
        catch { return false; }
    });

    // Keep <html> class in sync with state (so reloads are right even if JS loads late)
    useEffect(() => {
        const root = document.documentElement;
        if (collapsed) root.classList.add("prefers-collapsed");
        else root.classList.remove("prefers-collapsed");
    }, [collapsed]);

    const toggle = () => {
        setCollapsed(c => {
            const next = !c;
            try { localStorage.setItem("sidebar-collapsed", next ? "1" : "0"); } catch { }
            return next;
        });
    };

    return (
        <nav className={`sidebar${collapsed ? " collapsed" : ""}`} aria-label="Primary">
            <div className="sidebar-top-section">
                <div className="brand">
                    <TobyIcon />
                    <div className="title">Toby</div>
                </div>
                <button
                    className="collapse-btn"
                    onClick={toggle}
                    aria-expanded={!collapsed}
                    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    <svg className="chevron" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
                <ul className="nav">
                    {items.map((it) => (
                        <li className="nav-item" key={it.label}>
                            <a
                                className="nav-link"
                                href={it.href}
                                aria-label={it.ariaLabel ?? it.label}
                            >
                                <span className="icon" aria-hidden="true">{it.icon}</span>
                                <span className="label">{it.label}</span>
                                <span className="tooltip" role="tooltip">{it.label}</span>
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="nav-profile-section">
                <button className="nav-profile" onClick={() => navigate(`/users/${user?.id}`)} role="button">
                    <Avatar src={user?.profileImg ?? undefined} radius="xl" />
                    <span className="tooltip" role="tooltip">{user?.displayName}</span>
                    <div className="nav-profile-info">
                        <span className="nav-profile-info-name">
                            {user?.displayName}
                        </span>
                        <span className="nav-profile-info-household">{household?.name}</span>
                    </div>
                    <ExpandMoreRoundedIcon />
                </button>
            </div>
        </nav>
    );
}
