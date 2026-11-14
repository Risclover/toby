import { describe, it, expect } from "vitest";
import { getNotificationLink } from "../utils/notificationLinks";
import type { Notification } from "../notificationTypes";

const make = (overrides: Partial<Notification> = {}): Notification => ({
    id: 1,
    recipientId: 1,
    householdId: 1,
    actor: { id: 2, displayName: "Sam", profileImg: null },
    type: "task_assigned",
    entityType: "task",
    entityId: 40,
    entityLabel: "Dishes",
    entityLabels: ["Dishes"],
    parentId: 12,
    count: 1,
    createdAt: "2026-11-14T00:00:00+00:00",
    readAt: null,
    ...overrides,
});

describe("tasks", () => {
    it("opens the task's list", () => {
        expect(getNotificationLink(make())).toBe("/tasklists/12");
    });

    it("falls back to the index without a parent", () => {
        expect(getNotificationLink(make({ parentId: null }))).toBe("/tasklists");
    });

    it("deleted task still opens its list", () => {
        expect(getNotificationLink(make({ type: "task_deleted" }))).toBe("/tasklists/12");
    });
});

describe("lists", () => {
    it("single list opens its page", () => {
        const n = make({ type: "shopping_list_assigned", entityId: 3, parentId: null });
        expect(getNotificationLink(n)).toBe("/shopping/3");
    });

    it("batched lists open the index", () => {
        const n = make({ type: "tasklist_assigned", entityId: null, parentId: null, count: 3 });
        expect(getNotificationLink(n)).toBe("/tasklists");
    });

    it("removed from a list is not clickable", () => {
        expect(getNotificationLink(make({ type: "tasklist_unassigned" }))).toBeNull();
    });

    it("deleted list is not clickable", () => {
        expect(getNotificationLink(make({ type: "shopping_list_deleted" }))).toBeNull();
    });
});

describe("everything else", () => {
    it("events open the calendar", () => {
        expect(getNotificationLink(make({ type: "event_changed" }))).toBe("/calendar");
    });

    it("reminders and announcements", () => {
        expect(getNotificationLink(make({ type: "reminder_assigned" }))).toBe("/reminders");
        expect(getNotificationLink(make({ type: "announcement_edited" }))).toBe("/announcements");
    });

    it("admin request has no link", () => {
        expect(getNotificationLink(make({ type: "admin_request" }))).toBeNull();
    });

    it("new member opens their profile", () => {
        const n = make({ type: "member_joined", entityId: 5, parentId: null });
        expect(getNotificationLink(n)).toBe("/profile/5");
    });

    it("unknown type has no link", () => {
        const n = make({ type: "brand_new_type" as Notification["type"] });
        expect(getNotificationLink(n)).toBeNull();
    });
});