import { UserStat } from "./UserStat";

export type UserStatsSectionProps = {
    /** Title of stats section */
    title: string;
    /** Data of stats to display in section */
    stats: {
        title: string;
        icon: React.ElementType;
        stat: number;
        statId: string;
        statUnit?: string;
        iconColor: string;
    }[];
    /** Featured stats data */
    featuredStats: string[];
}

/** Stats section for a particular category of stat */
export const UserStatsSection = ({ title, stats, featuredStats }: UserStatsSectionProps) => {
    return (
        <div className="user-stats-section">
            <div className="settings-section-title">{title}</div>
            <div className="user-stats-section-container">
                {stats.map((stat) => (
                    <UserStat stat={stat} featuredStats={featuredStats} />
                ))}
            </div>
        </div>
    )
}