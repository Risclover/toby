import type { ReactNode } from "react";
import type { Notification, NotificationType } from "../notificationTypes";

// ---- HELPERS ----

const bold = (text: string) => <strong style={{ fontWeight: 500 }}>{text}</strong>;

// Actor is null when the person is gone (SET NULL on delete)
const who = (n: Notification) => bold(n.actor?.displayName ?? "A former member");

// Household events may carry the person in the label rather than the actor
const person = (n: Notification) => bold(n.actor?.displayName ?? n.entityLabel ?? "A former member");

const label = (n: Notification, fallback: string) => bold(n.entityLabel ?? fallback);


// ---- BUILDERS ----

// "Sam assigned you to Dishes"  /  "Sam assigned you to 3 tasks"
const itemMessage = (verb: string, noun: string) => (n: Notification): ReactNode =>
    n.count > 1
        ? <>{who(n)} {verb} {n.count} {noun}s</>
        : <>{who(n)} {verb} {label(n, `a ${noun}`)}</>;

// "Sara edited your announcement “Trash day…”"  /  "Sara deleted 3 of your announcements"
const announcementMessage = (verb: string) => (n: Notification): ReactNode =>
    n.count > 1
        ? <>{who(n)} {verb} {n.count} of your announcements</>
        : <>{who(n)} {verb} your announcement “{label(n, "an announcement")}”</>;


// ---- MESSAGES ----

export const notificationMessages: Record<NotificationType, (n: Notification) => ReactNode> = {
    // Tasks
    task_assigned: itemMessage("assigned you to", "task"),
    task_unassigned: itemMessage("unassigned you from", "task"),
    task_self_unassigned: itemMessage("unassigned themselves from", "task"),
    task_changed: itemMessage("edited", "task"),
    task_deleted: itemMessage("deleted", "task"),
    task_completed: itemMessage("completed", "task"),
    task_reopened: itemMessage("reopened", "task"),

    // Tasklists
    tasklist_assigned: itemMessage("added you to", "task list"),
    tasklist_unassigned: itemMessage("removed you from", "task list"),
    tasklist_self_unassigned: itemMessage("unassigned themselves from", "task list"),
    tasklist_changed: itemMessage("edited", "task list"),
    tasklist_deleted: itemMessage("deleted", "task list"),

    // Shopping lists
    shopping_list_assigned: itemMessage("added you to", "shopping list"),
    shopping_list_unassigned: itemMessage("removed you from", "shopping list"),
    shopping_list_self_unassigned: itemMessage("unassigned themselves from", "shopping list"),
    shopping_list_changed: itemMessage("edited", "shopping list"),
    shopping_list_deleted: itemMessage("deleted", "shopping list"),

    // Events
    event_assigned: itemMessage("added you to", "event"),
    event_unassigned: itemMessage("removed you from", "event"),
    event_self_unassigned: itemMessage("unassigned themselves from", "event"),
    event_changed: itemMessage("edited", "event"),
    event_deleted: itemMessage("deleted", "event"),

    // Reminders
    reminder_assigned: (n) =>
        n.count > 1
            ? <>{who(n)} set {n.count} reminders for you</>
            : <>{who(n)} set a reminder for you: {label(n, "a reminder")}</>,

    // Announcements
    announcement_edited: announcementMessage("edited"),
    announcement_deleted: announcementMessage("deleted"),

    // Household
    admin_request: (n) => <>{who(n)} asked you to become the admin of {label(n, "the household")}</>,
    admin_request_declined: (n) => <>{who(n)} declined to become the household admin</>,
    admin_changed: (n) => <>{label(n, "Someone")} is now the household admin</>,
    member_joined: (n) => <>{person(n)} joined the household</>,
    member_left: (n) => <>{person(n)} left the household</>,
    member_removed: (n) => <>{label(n, "A member")} was removed from the household</>,
    user_removed: (n) => <>You were removed from {label(n, "the household")}</>,
};


// ---- LOOKUP ----

// The only generic text: a safety net if the server sends a type this client doesn't know yet
export const getNotificationMessage = (n: Notification): ReactNode => {
    const render = notificationMessages[n.type];
    return render ? render(n) : "You have a new notification";
};