import { notifications } from "@mantine/notifications";

export const showHabitIncompleteToast = (name: string) => {
    notifications.show({
        title: "Habit marked incomplete",
        message: <span style={{ wordBreak: "break-word", lineHeight: 1.2 }}>{`"${name}" has returned. Go show it who's boss!`}</span>,
        autoClose: 3000,
        color: "rgb(22, 126, 41)",
    });
};