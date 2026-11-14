import type { Notification, NotificationType } from "../notificationTypes";

type LinkResolver = (n: Notification) => string | null;

// ---- BUILDERS ----

// Not clickable: the thing is gone, you lost access, or the row has its own buttons
const none: LinkResolver = () => null;

const to = (path: string): LinkResolver => () => path;

// The item's page when the notification points at one item, otherwise the index.
// A batch of different items has no entityId, so it lands on the index.
const detailOrIndex = (index: string): LinkResolver => (n) =>
    n.entityId !== null ? `${index}/${n.entityId}` : index;

// Tasks have no page of their own: open the list they live in
const taskList: LinkResolver = (n) =>
    n.parentId !== null ? `/tasklists/${n.parentId}` : "/tasklists";


// ---- LINKS ----

export const notificationLinks: Record<NotificationType, LinkResolver> = {
    // Tasks
    task_assigned: taskList,
    task_unassigned: taskList,
    task_self_unassigned: taskList,
    task_changed: taskList,
    task_deleted: taskList,
    task_completed: taskList,
    task_reopened: taskList,

    // Tasklists
    tasklist_assigned: detailOrIndex("/tasklists"),
    tasklist_unassigned: none,
    tasklist_self_unassigned: detailOrIndex("/tasklists"),
    tasklist_changed: detailOrIndex("/tasklists"),
    tasklist_deleted: none,

    // Shopping lists
    shopping_list_assigned: detailOrIndex("/shopping"),
    shopping_list_unassigned: none,
    shopping_list_self_unassigned: detailOrIndex("/shopping"),
    shopping_list_changed: detailOrIndex("/shopping"),
    shopping_list_deleted: none,

    // Events
    event_assigned: to("/calendar"),
    event_unassigned: to("/calendar"),
    event_self_unassigned: to("/calendar"),
    event_changed: to("/calendar"),
    event_deleted: none,

    // Reminders
    reminder_assigned: to("/reminders"),

    // Announcements
    announcement_edited: to("/announcements"),
    announcement_deleted: none,

    // Household
    admin_request: none,           // Accept / Reject buttons live in the row
    admin_request_declined: none,
    admin_changed: none,
    member_joined: (n) => (n.entityId !== null ? `/profile/${n.entityId}` : null),
    member_left: none,
    member_removed: none,
    user_removed: none,
};


// ---- LOOKUP ----

export const getNotificationLink = (n: Notification): string | null => {
    const resolve = notificationLinks[n.type];
    return resolve ? resolve(n) : null;
};