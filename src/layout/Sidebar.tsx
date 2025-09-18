import { useEffect, useState, type JSX } from "react";
import "./Sidebar.css";

type Item = {
    href: string;
    label: string;
    icon: JSX.Element;
    ariaLabel?: string;
};

const items: Item[] = [
    {
        href: "/",
        label: "Home",
        ariaLabel: "Home",
        icon: (
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path d="M3 11l9-7 9 7v8a2 2 0 0 1-2 2h-4v-6H9v6H5a2 2 0 0 1-2-2v-8z"
                    stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round" />
            </svg>
        ),
    },
    {
        href: "/tasklists",
        label: "Tasks",
        ariaLabel: "Tasks",
        icon: (
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
            </svg>
        ),
    },
    {
        href: "#",
        label: "Calendar",
        ariaLabel: "Calendar",
        icon: (
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
                <path d="M16 3v4M8 3v4M3 11h18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
            </svg>
        ),
    },
    {
        href: "#",
        label: "Settings",
        ariaLabel: "Settings",
        icon: (
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" stroke="currentColor" strokeWidth="2" fill="none" />
                <path d="M19.4 15a8 8 0 0 0 .1-6l1.7-1-2-3.5-2 .9a8 8 0 0 0-5.6 0l-2-.9-2 3.5 1.7 1a8 8 0 0 0 0 6l-1.7 1 2 3.5 2-.9a8 8 0 0 0 5.6 0l2 .9 2-3.5-1.7-1z"
                    stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round" />
            </svg>
        ),
    },
];

export default function Sidebar() {
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
            <div className="brand">
                <div className="logo" aria-hidden="true" />
                <div className="title">YourApp</div>
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
            </div>

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
        </nav>
    );
}
