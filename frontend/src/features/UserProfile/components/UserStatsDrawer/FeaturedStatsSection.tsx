import { Button } from "@mantine/core";
import { FeaturedStat } from "./FeaturedStat";
import { FeaturedStatsEmpty } from "./FeaturedStatsEmpty";
import { FeaturedStatsLoadingSkeleton } from "./FeaturedStatsLoadingSkeleton";
import { useDelayedLoading } from "@/hooks/useDelayedLoading";
import { ChevronRightIcon, StarIcon } from "@/assets";

type Props = {
    /** Handler for showing stats drawer */
    setShowStatsDrawer: (val: boolean) => void;
    /** Data for featured stats */
    featuredStatsInfo: {
        title: string;
        icon: React.ElementType;
        stat: number;
        statId: string;
        statUnit?: string;
        iconColor: string;
    }[];
    /** Whether the parent is the stats drawer */
    isDrawer: boolean;
    /** Whether stats are loading */
    isLoading: boolean;
}

/** Featured stats section, both on the main profile and in the stats drawer */
export const FeaturedStatsSection = ({ setShowStatsDrawer, featuredStatsInfo, isDrawer, isLoading }: Props) => {
    const showSkeleton = useDelayedLoading(isLoading);

    const content = showSkeleton
        ? <FeaturedStatsLoadingSkeleton />
        : isLoading
            ? null
            : featuredStatsInfo.length > 0
                ? <div className="featured-stats-grid">
                    {featuredStatsInfo.map((stat) => (
                        <FeaturedStat key={stat.statId} stat={stat} />
                    ))}
                </div>
                : !isDrawer
                    ? <FeaturedStatsEmpty setShowStatsDrawer={setShowStatsDrawer} />
                    : null;

    return (
        <div className="featured-stats-section">
            <div className="user-profile-section-header">
                {(isDrawer || featuredStatsInfo.length > 0) &&
                    <>
                        <div className="user-profile-section-title settings-section-title">
                            Featured Stats
                        </div>
                        {!isDrawer &&
                            <Button
                                className="stats-view-more-btn"
                                variant="transparent"
                                fw={500}
                                h="auto"
                                p="0"
                                size="sm"
                                color="rgb(5, 5, 73)"
                                onClick={() => setShowStatsDrawer(true)}
                            >
                                View more <ChevronRightIcon size='.5rem' color="rgb(5, 5, 73)" />
                            </Button>
                        }
                    </>
                }
            </div>
            {content}
            {isDrawer && (
                <div className="featured-stats-description">
                    <StarIcon size="1rem" color="rgb(5, 5, 73)" />
                    Select up to 4 stats to feature on your profile.
                </div>
            )}
        </div>
    )
}