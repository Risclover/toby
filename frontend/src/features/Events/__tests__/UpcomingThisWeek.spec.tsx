import { describe, it, expect, beforeEach } from "vitest";
import { Provider } from "react-redux";
import { MantineProvider } from "@mantine/core";
import { render, screen, waitFor, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import dayjs from "dayjs";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { store } from "@/store";
import { UpcomingThisWeek } from "../components/UpcomingThisWeek";

// ---------- helpers ----------
function renderApp(ui: React.ReactElement) {
    return render(
        <Provider store={store}>
            <MantineProvider>{ui}</MantineProvider>
        </Provider>
    );
}

const ymd = (d = new Date()) => dayjs(d).format("YYYY-MM-DD");
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);
function setLocalYmdTime(ymdStr: string, hh = 10, mm = 0) {
    const [y, m, d] = ymdStr.split("-").map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1, hh, mm, 0, 0);
}

// ---------- in-memory data + MSW ----------
let EVENTS: any[] = [];

function installHandlers() {
    server.use(
        // LIST (range or all)
        http.get("*/api/events/households/:hid/events", ({ request }) => {
            const url = new URL(request.url);
            const startIso = url.searchParams.get("start");
            const endIso = url.searchParams.get("end");

            if (startIso && endIso) {
                const start = new Date(startIso).getTime();
                const end = new Date(endIso).getTime();
                const inRange = EVENTS.filter((e) => {
                    if (!e.startUtc) return false;
                    const t = new Date(e.startUtc).getTime();
                    return t >= start && t <= end;
                });
                return HttpResponse.json(inRange, { status: 200 });
            }

            return HttpResponse.json(EVENTS, { status: 200 });
        }),

        // UPDATE (PATCH)
        http.patch("*/api/events/households/:hid/events/:id", async ({ params, request }) => {
            const id = Number(params.id);
            const body = (await request.json()) as any;

            const idx = EVENTS.findIndex((e) => e.id === id);
            if (idx === -1) return HttpResponse.json({ message: "not found" }, { status: 404 });

            // Title
            if (typeof body.title === "string") EVENTS[idx].title = body.title;

            // Timed update
            if (body.startUtc && body.endUtc) {
                EVENTS[idx].startUtc = body.startUtc;
                EVENTS[idx].endUtc = body.endUtc;
                EVENTS[idx].hasTime = true;
                if (body.tzid) EVENTS[idx].tzid = body.tzid;
            }

            // All-day update (date-only)
            if (body.date && !body.startUtc && !body.endUtc) {
                const tzid = body.tzid || EVENTS[idx].tzid || "UTC";
                const startLocal = setLocalYmdTime(body.date, 0, 0);
                const endLocal = addDays(startLocal, 1);
                EVENTS[idx].startUtc = startLocal.toISOString();
                EVENTS[idx].endUtc = endLocal.toISOString();
                EVENTS[idx].hasTime = false;
                EVENTS[idx].tzid = tzid;
            }

            return HttpResponse.json(EVENTS[idx], { status: 200 });
        })
    );
}

beforeEach(() => {
    // Seed: one timed event 2 days from now, 10:00–11:00
    const twoDays = ymd(addDays(new Date(), 2));
    const start = setLocalYmdTime(twoDays, 10, 0).toISOString();
    const end = setLocalYmdTime(twoDays, 11, 0).toISOString();
    EVENTS = [
        {
            id: 101,
            householdId: 1,
            title: "test3",
            startUtc: start,
            endUtc: end,
            hasTime: true,
            tzid: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
    ];
    installHandlers();
});

// ============ TESTS ============

describe("Edit event — title & date flows (Vitest + MSW + userEvent)", () => {
    it("edits the title and the list + input reflect the new value", async () => {
        const user = userEvent.setup();
        renderApp(<UpcomingThisWeek householdId={1} />);

        // Find the seeded card
        const titleNode = await screen.findByText("test3");
        expect(titleNode).toBeInTheDocument();

        const row = (titleNode as HTMLElement).closest(".upcoming-event") as HTMLElement;

        // Reveal hidden buttons (CSS hover)
        await user.hover(row);

        // Click edit
        const editBtn = within(row).getByRole("button", { name: /edit/i });
        await user.click(editBtn);

        // Change the title
        const titleInput = await screen.findByLabelText(/title/i);
        await user.clear(titleInput);
        await user.type(titleInput, "test");

        // Save
        await user.click(screen.getByRole("button", { name: /save/i }));

        // Input reflects updated title (modal remains open in app currently)
        await waitFor(() => expect(screen.getByLabelText(/title/i)).toHaveValue("test"));

        // List updates too
        await waitFor(() => expect(screen.getByText("test")).toBeInTheDocument());
    });

    it("moving the event to a date before today keeps the modal on that new date (no snap to today)", async () => {
        const user = userEvent.setup();
        renderApp(<UpcomingThisWeek householdId={1} />);

        // Open edit on the seeded row
        const titleNode = await screen.findByText(/test3|test/);
        const row = (titleNode as HTMLElement).closest(".upcoming-event") as HTMLElement;
        await user.hover(row);

        const editBtn = within(row).getByRole("button", { name: /edit/i });
        await user.click(editBtn);

        // Change date to 3 days before today
        const target = ymd(addDays(new Date(), -3));
        const dateInput = (await screen.findByLabelText(/date/i)) as HTMLInputElement;
        fireEvent.change(dateInput, { target: { value: target } });
        fireEvent.blur(dateInput); // commit change for Mantine’s controlled input

        // Ensure timed for this path (set a time)
        const timeInput = screen.getByLabelText(/time/i) as HTMLInputElement;
        await user.clear(timeInput);
        await user.type(timeInput, "10:00");

        // Save
        await user.click(screen.getByRole("button", { name: /save/i }));

        // The modal should now show the new date (even if it's outside the 7-day list)
        await waitFor(() => expect(screen.getByLabelText(/date/i)).toHaveValue(target));
    });
});
