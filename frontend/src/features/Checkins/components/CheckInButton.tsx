import { useGetUserCheckinsQuery, useCheckInTodayMutation } from "@/store/checkinSlice";
import { useAuthenticateQuery } from "@/store/authSlice";
import { Button } from "@mantine/core";

const toISO = (d: Date) => d.toISOString().slice(0, 10); // "YYYY-MM-DD"

export function CheckInButton() {
    const { data: user } = useAuthenticateQuery();
    const userId = user?.id;
    const today = toISO(new Date());

    const { data, isFetching } = useGetUserCheckinsQuery(
        { userId: userId!, from: today, to: today },
        { skip: !userId }
    );
    const checkedInToday = !!data?.dates?.length;

    const [checkInToday, { isLoading: checkingIn }] = useCheckInTodayMutation();

    return (
        <Button
            color="green"
            disabled={!userId || checkedInToday || isFetching || checkingIn}
            onClick={async () => {
                if (!userId) return;
                await checkInToday({ userId }).unwrap();
                // invalidatesTags will refresh today's query automatically
            }}
        >
            {checkedInToday ? "Checked in ✓" : checkingIn ? "Checking in…" : "Check in today"}
        </Button>
    );
}