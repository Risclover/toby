import { useHabitModal } from "@/contexts";
import { Button } from "@mantine/core";

export const HabitsEmpty = () => {
    const { openModal } = useHabitModal();

    return (
        <div className="habits-empty">
            You don't have any habits yet. Why don't you create one?
            <Button fw={500} size="sm" variant="light" color="navy" onClick={() => openModal()}>Create a new habit</Button>
        </div>
    )
}