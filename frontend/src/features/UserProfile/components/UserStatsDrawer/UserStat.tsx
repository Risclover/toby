import { useParams } from "react-router-dom";
import { ActionIcon } from "@mantine/core";
import { useIsSmallScreen } from "@/hooks";
import { useAuthenticateQuery, useUpdateFeaturedStatsMutation } from "@/store";
import { getLightColor } from "@/utils";
import { StarIcon, StarIconOutline } from "@/assets";

type Props = {
    /** Stat data */
    stat: {
        title: string;
        icon: React.ElementType;
        stat: number;
        statId: string;
        statUnit?: string;
        iconColor: string;
    };
    /** Featured stats */
    featuredStats: string[];
}

/** Component for single stat (in stats drawer) */
export const UserStat = ({ stat, featuredStats }: Props) => {
    const { userId } = useParams();
    const { data: currentUser } = useAuthenticateQuery();
    const [updateFeaturedStats] = useUpdateFeaturedStatsMutation();
    const isSmall = useIsSmallScreen(425);

    const Icon = stat.icon;
    const isOwner = currentUser.id === Number(userId);
    const isFeatured = featuredStats.includes(stat.statId);

    /** 'Feature stat' star toggle handler */
    const handleStarToggle = async () => {
        if (featuredStats.length === 4 && !isFeatured) {
            console.log('ERROR: Cannot feature more than 4 stats');
            return;
        }
        const nextFeaturedStats = isFeatured
            ? featuredStats.filter((id) => id !== stat.statId)
            : [...featuredStats, stat.statId];

        await updateFeaturedStats({
            userId: Number(userId),
            statIds: nextFeaturedStats,
        }).unwrap();
    };

    return (
        <div className="user-stat-container">
            <div className="user-stat-container-left">
                <div className="user-stat-icon">
                    <Icon color={stat.iconColor} size={isSmall ? "1rem" : "1.5rem"} />
                </div>
                <div className={`user-stat-title${isSmall ? " small-title" : ""}`}>
                    {stat.title}
                </div>
            </div>

            <div className="user-stat-container-right">
                <div className={`user-stat-value${isSmall ? " small-value" : ""}`}>
                    {stat.stat}{stat.statUnit}
                </div>
                <div className={`user-stat-star${isSmall ? " small-star" : ""}`}>
                    {!isOwner ?
                        <div>
                            {isFeatured ? (
                                <StarIcon size={isSmall ? "1.25rem" : "1.5rem"} color="rgb(5, 5, 73)" />
                            ) : (
                                <StarIconOutline
                                    size={isSmall ? "1.25rem" : "1.5rem"}
                                    color={featuredStats.length === 4 ? "var(--mantine-color-gray-5)" : getLightColor("#050549", 0.6)}
                                />
                            )}
                        </div> :
                        <ActionIcon
                            color="transparent"
                            onClick={handleStarToggle}
                            variant="transparent"
                            radius="50%"
                            p={0}
                            mb={isSmall ? 2 : 0}
                            size="auto"
                            style={featuredStats.length >= 4 && !isFeatured ? { pointerEvents: "none" } : undefined}

                        >
                            {isFeatured ? (
                                <StarIcon size={isSmall ? "1.25rem" : "1.5rem"} color="rgb(5, 5, 73)" />
                            ) : (
                                <StarIconOutline
                                    size={isSmall ? "1.25rem" : "1.5rem"}
                                    color={featuredStats.length === 4 ? "var(--mantine-color-gray-5)" : getLightColor("#050549", 0.6)}
                                />
                            )}
                        </ActionIcon>}
                </div>
            </div>
        </div>
    );
};