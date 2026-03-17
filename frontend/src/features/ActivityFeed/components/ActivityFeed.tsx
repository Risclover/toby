import { useGetActivityQuery, type ActivityEvent } from "@/store";
import { Link } from "react-router-dom";
import "../styles/ActivityFeed.css";
import { Avatar, Box, Tooltip } from "@mantine/core";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ActivityFeedSkeletons } from "./ActivityFeedSkeletons";

type Props = {
    isReady: boolean;
    householdId: number;
};

type FormattedEvent = {
    line1: React.ReactNode;
    line2?: React.ReactNode;
};

export const ActivityFeed = ({ isReady, householdId }: Props) => {
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const { data, isLoading, isSuccess, isError } = useGetActivityQuery({ householdId });

    const showSkeleton = isLoading || (!isSuccess && !data);

    const label = (text: string | null) => (
        <Tooltip multiline label={text} openDelay={400} withArrow>
            <Box component="span" className="event-label">{text}</Box>
        </Tooltip>
    );

    const formatTime = (isoString: string): string => {
        const normalized = isoString.endsWith("Z") ? isoString : isoString + "Z";
        const diff = Math.floor((Date.now() - new Date(normalized).getTime()) / 1000);
        if (diff < 60) return "just now";
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
        return new Date(normalized).toLocaleDateString();
    };

    const formatEvent = (event: ActivityEvent): FormattedEvent => {
        console.log('event:', event)
        switch (event.entityType) {
            case "task": {
                const listTitle = event.eventMetadata?.listTitle;
                const listId = event.eventMetadata?.listId;
                const inList = listTitle && listId
                    ? <> in <Link className="event-link" to={`/tasklists/${listId}`} target="_blank" rel="noreferrer">{listTitle}</Link></>
                    : null;
                switch (event.action) {
                    case "created": return { line1: <>added a task{inList}</>, line2: label(event.entityLabel) };
                    case "completed": return { line1: <>completed a task{inList}</>, line2: label(event.entityLabel) };
                    case "uncompleted": return { line1: <>marked a task as incomplete{inList}</>, line2: label(event.entityLabel) };
                    case "deleted": return { line1: <>deleted a task{inList}</>, line2: label(event.entityLabel) };
                    default: return { line1: <>updated a task{inList}</>, line2: label(event.entityLabel) };
                }
            }
            case "tasklist": {
                const listLink = event.entityId
                    ? <Link className="event-link" to={`/tasklists/${event.entityId}`} target="_blank" rel="noreferrer">{event.entityLabel}</Link>
                    : <>{event.entityLabel}</>;
                const duplicatedFrom = event.eventMetadata?.duplicatedFrom;
                switch (event.action) {
                    case "created": return duplicatedFrom
                        ? { line1: <>duplicated list {listLink} from {duplicatedFrom}</> }
                        : { line1: <>created list {listLink}</> };
                    case "deleted": return { line1: <>deleted list {event.entityLabel}</> };
                    case "archived": return { line1: <>archived list {listLink}</> };
                    case "unarchived": return { line1: <>unarchived list {listLink}</> };
                    case "renamed": return { line1: <>renamed {event.eventMetadata?.oldTitle} to {event.entityLabel}</> };
                    case "completed": return { line1: <>completed all tasks in {listLink}</> };
                    case "uncompleted": return { line1: <>marked all tasks incomplete in {listLink}</> };
                    default: return { line1: <>updated list {listLink}</> };
                }
            }
            case "shopping_list": {
                switch (event.action) {
                    case "created": return { line1: <>created shopping list {event.entityLabel}</> };
                    case "deleted": return { line1: <>deleted shopping list {event.entityLabel}</> };
                    default: return { line1: <>updated shopping list {event.entityLabel}</> };
                }
            }
            case "shopping_item": {
                switch (event.action) {
                    case "created": return { line1: <>added to the shopping list:</>, line2: label(event.entityLabel) };
                    case "purchased": return { line1: <>checked off:</>, line2: label(event.entityLabel) };
                    case "unpurchased": return { line1: <>unchecked:</>, line2: label(event.entityLabel) };
                    case "deleted": return { line1: <>removed from the shopping list:</>, line2: label(event.entityLabel) };
                    default: return { line1: <>updated:</>, line2: label(event.entityLabel) };
                }
            }
            case "announcement":
                return { line1: event.action === "created" ? <>posted an announcement</> : <>deleted an announcement</> };
            case "checkin":
                return { line1: <>checked in for the day</> };
            default:
                return { line1: <>{event.action} {event.entityType}</> };
        }
    };

    return (
        <div className="events-list">
            {!isReady || showSkeleton ? (
                <ActivityFeedSkeletons />
            ) : isError || !data ? (
                <p>Could not load activity.</p>
            ) : data.items.length === 0 ? (
                <p>No recent activity.</p>
            ) : (
                <ul>
                    {data.items.map((event) => {
                        const { line1, line2 } = formatEvent(event);
                        return (
                            <li key={event.id} className="event">
                                <Avatar size={22} mr="5px" src={event.actor.profileImg} />
                                <div className="event-text">
                                    <div className="event-line1">
                                        <span className="event-main">
                                            <Link className="event-link" to={`/users/${event.actor.id}`}>{event.actor.displayName}</Link>{" "}
                                            {line1}
                                        </span>
                                        <span className="event-time">{formatTime(event.createdAt)}</span>
                                    </div>
                                    {line2 && (
                                        <div
                                            className="event-line2"
                                            onClick={(e) => { e.stopPropagation(); setExpandedId(expandedId === event.id ? null : event.id); }}
                                        >
                                            {line2}
                                        </div>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>)}
        </div>
    );
};