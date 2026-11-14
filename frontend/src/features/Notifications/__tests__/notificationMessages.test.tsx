import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { getNotificationMessage } from "../utils/notificationMessages";
import { NOTIFICATION_TYPES, type Notification } from "../notificationTypes";

const make = (overrides: Partial<Notification> = {}): Notification => ({
    id: 1,
    recipientId: 1,
    householdId: 1,
    actor: { id: 2, displayName: "Sam", profileImg: null },
    type: "task_assigned",
    entityType: "task",
    entityId: 10,
    entityLabel: "Dishes",
    entityLabels: ["Dishes"],
    parentId: null,
    count: 1,
    createdAt: "2026-11-14T00:00:00+00:00",
    readAt: null,
    ...overrides,
});

const text = (n: Notification) =>
    renderToStaticMarkup(<>{getNotificationMessage(n)}</>).replace(/<[^>]+>/g, "");


describe("every type", () => {
    it.each(NOTIFICATION_TYPES)("%s has a message", (type) => {
        expect(text(make({ type }))).not.toBe("You have a new notification");
        expect(text(make({ type, count: 3 }))).not.toBe("You have a new notification");
    });
});

describe("wording", () => {
    it("single assignment", () => {
        expect(text(make())).toBe("Sam assigned you to Dishes");
    });

    it("batched assignment", () => {
        expect(text(make({ count: 3 }))).toBe("Sam assigned you to 3 tasks");
    });

    it("self-unassign names the person", () => {
        expect(text(make({ type: "task_self_unassigned" }))).toBe("Sam unassigned themselves from Dishes");
    });

    it("list batches use the list noun", () => {
        expect(text(make({ type: "shopping_list_deleted", count: 2 }))).toBe("Sam deleted 2 shopping lists");
    });

    it("reminder single and batched", () => {
        const base = { type: "reminder_assigned" as const, entityLabel: "Call the vet" };
        expect(text(make(base))).toBe("Sam set a reminder for you: Call the vet");
        expect(text(make({ ...base, count: 3 }))).toBe("Sam set 3 reminders for you");
    });

    it("announcement edit", () => {
        const n = make({ type: "announcement_edited", entityLabel: "Trash day" });
        expect(text(n)).toBe("Sam edited your announcement “Trash day”");
    });

    it("user removed", () => {
        const n = make({ type: "user_removed", entityLabel: "The Sara Family" });
        expect(text(n)).toBe("You were removed from The Sara Family");
    });

    it("admin changed uses the label", () => {
        const n = make({ type: "admin_changed", entityLabel: "John" });
        expect(text(n)).toBe("John is now the household admin");
    });
});

describe("edge cases", () => {
    it("null actor", () => {
        expect(text(make({ actor: null }))).toBe("A former member assigned you to Dishes");
    });

    it("unknown type falls back", () => {
        const n = make({ type: "brand_new_type" as Notification["type"] });
        expect(text(n)).toBe("You have a new notification");
    });
});