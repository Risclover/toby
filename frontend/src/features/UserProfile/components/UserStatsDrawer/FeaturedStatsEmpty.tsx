import { useParams } from "react-router-dom"
import { Button } from "@mantine/core";
import { useAuthenticateQuery, useGetUserQuery } from "@/store";
import { getLightColor } from "@/utils";
import { ChevronRightIcon, StarIconOutline, StatsIcon } from "@/assets";

type Props = {
    /** Whether the stats drawer is open */
    setShowStatsDrawer: (val: boolean) => void;
}

/** Empty states for featured stats */
export const FeaturedStatsEmpty = ({ setShowStatsDrawer }: Props) => {
    const { userId } = useParams();
    const { data: currentUser, isLoading: isAuthLoading } = useAuthenticateQuery();
    const { data: user, isLoading: isUserLoading } = useGetUserQuery(Number(userId));

    const isOwner = currentUser?.id === Number(userId);
    const possessive = user?.firstName.endsWith('s') ? `${user?.firstName}'` : `${user?.firstName}'s`;

    if (isAuthLoading || isUserLoading) return null;

    if (isOwner) {
        return (
            <div className="featured-stats-empty-owner">
                <div className="featured-stats-empty--icon" style={{ backgroundColor: getLightColor("#050549", .1) }}>
                    <StarIconOutline size="1.5rem" color="rgb(5, 5, 73)" />
                </div>
                <div className="featured-stats-empty-owner--title">
                    No featured stats yet
                </div>
                <div className="featured-stats-empty-owner--subtext">
                    Star up to 4 stats to pin them here for your household to see.
                </div>
                <Button
                    mt="1rem"
                    size="sm"
                    leftSection={
                        <StatsIcon size=".875rem" color="rgb(5, 5, 73)" />
                    }
                    variant="light"
                    color="rgb(5, 5, 73)"
                    onClick={() => setShowStatsDrawer(true)}
                >
                    View your stats
                </Button>
            </div>
        )
    } else {
        return (
            <button className="featured-stats-empty" onClick={() => setShowStatsDrawer(true)}>
                <div className="featured-stats-empty--left">
                    <div className="featured-stats-empty--icon">
                        <StatsIcon size="1rem" color="rgb(5, 5, 73)" />
                    </div>
                    View {possessive} stats
                </div>
                <div className="featured-stats-empty--right">
                    <ChevronRightIcon size=".625rem" color="var(--mantine-color-gray-7)" />
                </div>
            </button>
        )
    }
}