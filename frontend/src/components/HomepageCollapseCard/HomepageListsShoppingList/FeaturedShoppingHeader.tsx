import { ActionIcon, Progress, Tooltip } from "@mantine/core";
import { ExternalLinkIcon } from "@/assets/icons/ExternalLinkIcon";

type Props = {
    title: string | undefined;
    listId: number | undefined;
    uncheckedCount: number;
    totalCount: number;
    percent: number;
    showProgress: boolean;
    color: string | undefined;
};

export const FeaturedShoppingHeader = ({ title, listId, uncheckedCount, totalCount, percent, showProgress, color }: Props) => (
    <div className="featured-tasklist-title">
        <div className="featured-tasklist-title-top">
            <span>{title}</span>{" "}
            <span className="featured-tasklist-title-count">
                ({uncheckedCount === 0 ? "🛒" : `${uncheckedCount} / ${totalCount}`})
            </span>
            <Tooltip label="Open shopping list" withArrow openDelay={500}>
                <ActionIcon
                    size="sm"
                    variant="transparent"
                    onClick={() => window.open(`/shopping/${listId}`, "_blank")}
                >
                    <ExternalLinkIcon size="1rem" color={color} />
                </ActionIcon>
            </Tooltip>
        </div>
        {showProgress && (
            <div className="featured-tasklist-title-progress">
                <div className="progress-left"><Progress value={percent} color={color} /></div>{" "}
                <span>{percent}%</span>
            </div>
        )}
    </div>
);