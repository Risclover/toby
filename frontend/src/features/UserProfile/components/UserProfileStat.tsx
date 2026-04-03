type Props = {
    icon: any;
    stat: number | undefined;
    statLabel: string;
    description: string;
}

export const UserProfileStat = ({ icon, stat, statLabel, description }: Props) => {
    return (
        <div className="user-profile-stat">
            <span className="user-profile-stat-icon">{icon}</span>
            <span className="user-profile-stat-num">{stat}{statLabel}</span>
            <span className="user-profile-stat-title">{description}</span>
        </div>
    )
}