import { useCreateEventMutation } from "@/store/eventSlice";
import { DashboardMiniCalendar } from "../components/DashboardMiniCalendar";
import { describe, expect, it } from "vitest";
import dayjs from "dayjs";
import { server } from "@/test/msw/server";
import { http, HttpResponse } from 'msw';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { store } from '@/store';
import { Provider } from "react-redux";
import { MantineProvider } from "@mantine/core";

function Harness() {
    const [createEvent] = useCreateEventMutation();

    const handleClick = async () => {
        const tzid = Intl.DateTimeFormat().resolvedOptions().timeZone;

        await createEvent({
            householdId: 1,
            title: "Test Event",
            startUtc: new Date().toISOString(),
            endUtc: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            tzid
        } as any)
    }
    return (
        <div>
            <button
                data-testid="create"
                onClick={handleClick}
            >
                Create
            </button>
            <DashboardMiniCalendar householdId={1} showAddEvent={false} setShowAddEvent={() => { }} />
        </div>
    )
}

describe("DashboardMiniCalendar - dot appears after event creation", () => {
    it("sets data-has-events='true' for today after creation", async () => {
        const today = dayjs().format("YYYY-MM-DD");

        const events: any[] = [];

        server.use(
            http.get("*/api/events/households/:hid/events", () => {
                return HttpResponse.json(events, { status: 200 })
            }),

            http.post("*/api/events/households/:hid/events", async ({ request }) => {
                const body = await request.json() as any;
                const created = {
                    id: Date.now(),
                    ...body,
                    startUtc: new Date().toISOString(),
                    endUtc: new Date(Date.now() + 60 * 60 * 1000).toISOString()
                };

                events.push(created);

                return HttpResponse.json(created, { status: 201 })
            })
        )

        render(
            <Provider store={store}>
                <MantineProvider>
                    <Harness />
                </MantineProvider>
            </Provider>
        )

        const dayBtn = await screen.findByTestId(`cal-day-${today}`);
        expect(dayBtn).not.toHaveAttribute("data-has-events", "true");

        fireEvent.click(screen.getByTestId("create"));

        await waitFor(() => expect(screen.getByTestId(`cal-day-${today}`)).toHaveAttribute("data-has-events", "true"));
    })
})