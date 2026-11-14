// One list is the source of truth. The union type and the tests both derive from it.
export const NOTIFICATION_TYPES = [
    // Events
    "event_assigned", "event_unassigned", "event_changed", "event_deleted", "event_self_unassigned",
    // Tasklists
    "tasklist_assigned", "tasklist_unassigned", "tasklist_deleted", "tasklist_changed", "tasklist_self_unassigned",
    // Tasks
    "task_assigned", "task_unassigned", "task_self_unassigned", "task_changed", "task_deleted", "task_completed", "task_reopened",
    // Shopping lists
    "shopping_list_assigned", "shopping_list_unassigned", "shopping_list_deleted", "shopping_list_changed", "shopping_list_self_unassigned",
    // Reminders
    "reminder_assigned",
    // Announcements
    "announcement_edited", "announcement_deleted",
    // Household
    "admin_changed", "admin_request", "admin_request_declined", "member_joined", "member_left", "member_removed", "user_removed",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export type NotificationEntity =
    | "task" | "event" | "shopping_list" | "tasklist" | "user" | "reminder" | "announcement";

export interface NotificationActor {
    id: number;
    displayName: string;
    profileImg: string | null;
}

export interface Notification {
    id: number;
    recipientId: number;
    householdId: number;
    actor: NotificationActor | null;
    type: NotificationType;
    entityType: NotificationEntity | null;
    entityId: number | null;
    entityLabel: string | null;
    entityLabels: string[];
    parentId: number | null;
    count: number;
    createdAt: string;
    readAt: string | null;
}