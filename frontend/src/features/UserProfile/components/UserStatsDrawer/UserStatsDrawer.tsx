import { Drawer } from "@mantine/core";
import { UserStatsSection } from "./UserStatsSection";
import { FeaturedStatsSection } from "./FeaturedStatsSection";
import { useUserStats } from "../../hooks/useUserStats";

type Props = {
    /** Whether the drawer is currently open */
    opened: boolean;
    /** Handler for closing the drawer */
    close: () => void;
}

/** Drawer that displays all of a user's stats */
export const UserStatsDrawer = ({ opened, close }: Props) => {
    const {
        statsInfo,
        featuredStatsInfo,
        featuredStats,
        isLoading,
        isOwner
    } = useUserStats();
    return (
        <Drawer
            opened={opened}
            onClose={close}
            title="User Stats"
            position="bottom"
            styles={{
                content: {
                    height: "min-content",
                    maxHeight: "60vh",
                    borderTopLeftRadius: "1rem",
                    borderTopRightRadius: "1rem",
                    background: "#f6f6f8"
                },
                header: {
                    background: "#f6f6f8"
                },
                body: {
                    padding: "1rem", paddingTop: ".5rem",
                },
            }}
            size="auto"
            mah="50vh"
            h="100%"
            className="user-stats-drawer"
        >
            {isOwner && <FeaturedStatsSection
                setShowStatsDrawer={() => { }}
                featuredStatsInfo={featuredStatsInfo}
                isDrawer={true}
                isLoading={isLoading}
            />}
            {
                statsInfo.map((section) => (
                    <UserStatsSection
                        key={section.id}
                        title={section.sectionTitle}
                        stats={section.stats}
                        featuredStats={featuredStats}
                    />
                ))
            }
        </Drawer >
    )
}