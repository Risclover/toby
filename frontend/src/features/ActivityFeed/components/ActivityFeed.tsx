import { useGetActivityQuery, type ActivityEvent } from "@/store";
import { Link } from "react-router-dom";
import "../styles/ActivityFeed.css";
import { Avatar } from "@mantine/core";

type Props = {
    householdId: number;
};

export const ActivityFeed = ({ householdId }: Props) => {
    const { data, isLoading, isError } = useGetActivityQuery({ householdId });

    const formatEvent = (event: ActivityEvent): React.ReactNode => {
        switch (event.entityType) {
            case "task": {
                const listTitle = event.eventMetadata?.listTitle;
                const listId = event.eventMetadata?.listId;
                const inList = listTitle && listId
                    ? <> in <Link className="event-link" to={`/tasklists/${listId}`} target="_blank" rel="noreferrer">{listTitle}</Link>:</>
                    : null;
                switch (event.action) {
                    case "created": return <>added a task{inList} "{event.entityLabel}"</>;
                    case "completed": return <>completed a task{inList} "{event.entityLabel}"</>;
                    case "deleted": return <>deleted a task{inList} "{event.entityLabel}"</>;
                    default: return <>updated a task{inList} "{event.entityLabel}"</>;
                }
            }
            case "tasklist":
                const listTitle = event.eventMetadata?.listTitle;
                const listId = event.eventMetadata?.listId;
                const inList = listTitle && listId
                    ? <> <Link className="event-link" to={`/tasklists/${listId}`} target="_blank" rel="noreferrer">{listTitle}</Link></>
                    : null;
                return <>created list {inList}</>;
            case "shopping_list":
                return event.action === "created"
                    ? <>created shopping list "{event.entityLabel}"</>
                    : <>deleted shopping list "{event.entityLabel}"</>;
            case "shopping_item":
                switch (event.action) {
                    case "created": return <>added "{event.entityLabel}" to the shopping list</>;
                    case "purchased": return <>checked off "{event.entityLabel}"</>;
                    case "unpurchased": return <>unchecked "{event.entityLabel}"</>;
                    case "deleted": return <>removed "{event.entityLabel}" from the shopping list</>;
                    default: return <>updated "{event.entityLabel}"</>;
                }
            case "announcement":
                return event.action === "created"
                    ? <>posted an announcement</>
                    : <>deleted an announcement</>;
            case "checkin":
                return <>checked in for the day</>;
            default:
                return <>{event.action} {event.entityType}</>;
        }
    };

    if (isLoading) return <p>Loading activity...</p>;
    if (isError || !data) return <p>Could not load activity.</p>;
    if (data.items.length === 0) return <p>No recent activity.</p>;

    return (
        <ul>
            {data.items.map((event) => (
                <li key={event.id} className="event">
                    <Avatar size="xs" src={event.actor.profileImg} />
                    <div>
                        <Link className="event-link" to={`/users/${event.actor.id}`}>{event.actor.displayName}</Link>{" "}
                        {formatEvent(event)}
                    </div>
                </li>
            ))}
        </ul>
    );
};