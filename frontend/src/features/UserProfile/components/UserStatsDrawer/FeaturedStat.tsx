import { useIsSmallScreen } from "@/hooks";
import { getLightColor } from "@/utils";

type Props = {
    stat: {
        title: string;
        icon: React.ElementType;
        stat: number;
        statId: string;
        statUnit?: string;
        iconColor: string;
    }
}

export const FeaturedStat = ({ stat }: Props) => {
    const isSmall = useIsSmallScreen(375);
    const Icon = stat.icon;

    if (!stat) return null;
    return (
        <div className="featured-stat">
            <div className="featured-stat-icon" style={{ backgroundColor: getLightColor(stat.iconColor, 0.1) }}>
                <Icon size={isSmall ? "1rem" : "1.5rem"} color={stat.iconColor || "rgb(5, 5, 73)"} />
            </div>
            <div className="featured-stat-value">{stat.stat}{stat.statUnit}</div>
            <div className="featured-stat-title">{stat.title}</div>
        </div>
    )
}