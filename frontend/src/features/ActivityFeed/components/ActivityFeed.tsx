import { useGetActivityQuery, useGetHouseholdQuery, type ActivityEvent } from "@/store";
import { Link } from "react-router-dom";
import "../styles/ActivityFeed.css";
import { Avatar, Box, Button, Collapse, Text, Tooltip } from "@mantine/core";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ActivityFeedSkeletons } from "./ActivityFeedSkeletons";
import { useDisclosure } from "@mantine/hooks";

type Props = {
    isReady?: boolean;
    householdId: number;
    actorId?: number;
};

type FormattedEvent = {
    line1: React.ReactNode;
    line2?: React.ReactNode;
};

export const ActivityFeed = ({ isReady, householdId, actorId }: Props) => {
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const { data: household } = useGetHouseholdQuery(householdId, { skip: !householdId });
    const [expanded, { toggle }] = useDisclosure(false);
    const { data, isLoading, isSuccess, isError } = useGetActivityQuery(
        { householdId, actorId },
        { skip: !householdId }
    );

    const showSkeleton = isLoading || (!isSuccess && !data);

    const label = (text: string | null) => (
        <Box component="span" className="event-label">{text}</Box>
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

    // Was formatTaskLine2 — nothing in here was actually task-specific, it
    // just consumed entityLabels + count off the event and rendered a
    // singular label or an expandable "click to show N" list. Generalized
    // with a `nounPlural` param so shopping_item events can reuse it too
    // instead of duplicating the same collapse/expand logic.
    const formatGroupedLine2 = (event: ActivityEvent, nounPlural: string): React.ReactNode => {
        const labels = event.entityLabels ?? [];
        const count = event.count ?? 1;

        if (count === 1) return label(event.entityLabel);
        if (labels.length === 0) return null;

        const isExpanded = expandedId === event.id;
        const collapseId = `event-task-list-${event.id}`;

        return (
            <div className="event-task-details">
                <Button
                    fw={400}
                    h="auto"
                    size="xs"
                    p={0}
                    variant="transparent"
                    type="button"
                    className="event-task-toggle"
                    aria-expanded={isExpanded}
                    aria-controls={collapseId}
                    onClick={(e) => {
                        e.stopPropagation();
                        setExpandedId(isExpanded ? null : event.id);
                    }}
                >
                    {isExpanded ? `Hide ${nounPlural}` : `Click to show ${nounPlural} (${labels.length})`}
                </Button>

                <Collapse expanded={isExpanded}>
                    <ol id={collapseId} className="event-task-list">
                        {labels.map((itemLabel, i) => (
                            <li key={`${event.id}-${i}`} className="event-task-list-item">
                                <Text size="13px" lh="1.5" truncate lineClamp={1}>
                                    {itemLabel}
                                </Text>
                            </li>
                        ))}
                    </ol>
                </Collapse>
            </div>
        );
    };

    const formatEvent = (event: ActivityEvent): FormattedEvent => {
        const count = event.count ?? 1;

        switch (event.entityType) {
            case "task": {
                const listTitle = event.eventMetadata?.listTitle;
                const listId = event.eventMetadata?.listId;
                const inList = listTitle && listId
                    ? <> in <Link className="event-link" to={`/tasklists/${listId}`} target="_blank" rel="noreferrer">{listTitle}</Link></>
                    : null;
                const line2 = formatGroupedLine2(event, "tasks");
                switch (event.action) {
                    case "created": return {
                        line1: <>added {count === 1 ? "a task" : `${count} tasks`}{inList}</>,
                        line2,
                    };
                    case "completed": return {
                        line1: <>completed {count === 1 ? "a task" : `${count} tasks`}{inList}</>,
                        line2,
                    };
                    case "uncompleted": return {
                        line1: <>marked {count === 1 ? "a task" : `${count} tasks`} as incomplete{inList}</>,
                        line2,
                    };
                    case "deleted": return {
                        line1: <>deleted {count === 1 ? "a task" : `${count} tasks`}{inList}</>,
                        line2,
                    };
                    default: return {
                        line1: <>updated {count === 1 ? "a task" : `${count} tasks`}{inList}</>,
                        line2,
                    };
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
                const listLink = event.entityId
                    ? <Link className="event-link" to={`/shopping/${event.entityId}`} target="_blank" rel="noreferrer">{event.entityLabel}</Link>
                    : <>{event.entityLabel}</>;
                const duplicatedFrom = event.eventMetadata?.duplicatedFrom;
                switch (event.action) {
                    case "created": return duplicatedFrom
                        ? { line1: <>duplicated shopping list {listLink} from {duplicatedFrom}</> }
                        : { line1: <>created shopping list {listLink}</> };
                    case "deleted": return { line1: <>deleted shopping list {event.entityLabel}</> };
                    case "archived": return { line1: <>archived shopping list {listLink}</> };
                    case "unarchived": return { line1: <>unarchived shopping list {listLink}</> };
                    case "renamed": return { line1: <>renamed {event.eventMetadata?.oldTitle} to {event.entityLabel}</> };
                    case "completed": return { line1: <>completed all items in {listLink}</> };
                    case "uncompleted": return { line1: <>marked all items incomplete in {listLink}</> };
                    default: return { line1: <>updated shopping list {listLink}</> };
                }
            }
            case "shopping_item": {
                const listTitle = event.eventMetadata?.listTitle;
                const listId = event.eventMetadata?.listId;
                const inList = listTitle && listId
                    ? <> in <Link className="event-link" to={`/shopping/${listId}`} target="_blank" rel="noreferrer">{listTitle}</Link></>
                    : null;
                const line2 = formatGroupedLine2(event, "items");
                switch (event.action) {
                    case "created": return {
                        line1: count === 1 ? <>added an item{inList}</> : <>added {count} items{inList}</>,
                        line2,
                    };
                    case "purchased": return {
                        line1: count === 1 ? <>checked off an item{inList}</> : <>checked off {count} items{inList}</>,
                        line2,
                    };
                    case "unpurchased": return {
                        // Singular phrasing kept as-is ("unchecked:" reads naturally
                        // with the item name directly below it via line2). Plural
                        // needs its own sentence since "unchecked: [expandable]"
                        // doesn't read the same way "unchecked: Milk" does.
                        line1: count === 1 ? <>unchecked:</> : <>marked {count} items as unchecked{inList}</>,
                        line2,
                    };
                    case "deleted": return {
                        line1: count === 1
                            ? <>removed from the shopping list:</>
                            : <>removed {count} items from the shopping list{inList}</>,
                        line2,
                    };
                    default: return {
                        line1: count === 1 ? <>updated:</> : <>updated {count} items{inList}</>,
                        line2,
                    };
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
                <div className="empty-announcements">No recent activity.</div>
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
                                            <Link className="event-link" to={`/profile/${event.actor.id}`} style={{ color: event.actor.id === household?.adminId ? "var(--mantine-color-violet-7)" : "var(--mantine-color-blue-7)" }}>{event.actor.displayName}</Link>{" "}
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