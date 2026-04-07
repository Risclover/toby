import { Button, Stack } from "@mantine/core";
import { notifications } from "@mantine/notifications";

export const showHabitCompleteToast = (name: string, onUndo?: () => void) => {
    const id = `habit-complete-${name}`;
    notifications.show({
        id,
        title: "Habit completed",
        message: (
            <Stack gap="4px" align="flex-start">
                <span style={{ wordBreak: "break-word", lineHeight: 1.2, color: "var(--mantine-color-dark-6)" }}>{`"${name}" is done for the day. Keep it up, champ!`}</span>
                {onUndo ? <Button p="0.5rem" h="auto" size="xs" color="var(--mantine-color-dark-6)" variant="light" onClick={() => {
                    notifications.hide(id);
                    onUndo();
                }}>Undo</Button> : null}
            </Stack>
        ),
        autoClose: 5000,
        color: "rgb(22, 126, 41)",
    });
};