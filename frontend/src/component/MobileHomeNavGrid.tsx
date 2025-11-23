export const MobileHomeNavGrid = () => {
    const navBtns = [
        {
            title: "Tasks",
            icon: "📝",
            link: "/mobile/tasks"
        },
        {
            title: "Shopping",
            icon: "🛒",
            link: "/mobile/shopping"
        },
        {
            title: "Events",
            icon: "📅",
            link: "/mobile/events"
        },
        {
            title: "Projects",
            icon: "📂",
            link: "/mobile/projects"
        },
        {
            title: "Finances",
            icon: "💰",
            link: "/mobile/finances"
        }
    ]

    return (
        <div className="mobile-home-nav-grid">
            {navBtns.map((btn, index) => (
                <MobileHomeNavGridBtn key={index} btn={btn} />
            ))}
        </div>
    )
}

type BtnProps = {
    btn: {
        title: string;
        icon: string;
        link: string;
    }
}

const MobileHomeNavGridBtn = ({ btn }: BtnProps) => {
    return (
        <div className="mobile-home-nav-grid-btn" onClick={() => window.location.href = btn.link}>
            <span>{btn.icon}</span> {btn.title}
        </div>
    )
}