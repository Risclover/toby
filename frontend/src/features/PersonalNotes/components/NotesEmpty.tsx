import { Button } from "@mantine/core";
import { usePersonalNoteModal } from "@/contexts";

/** Notes empty state */
export const NotesEmpty = () => {
    const { openModal } = usePersonalNoteModal();

    return (
        <div className="habits-empty">
            You don't have any notes yet. Why don't you create one?
            <Button fw={500} size="sm" variant="light" color="rgb(5, 5, 73)" onClick={() => openModal()}>Create a new note</Button>
        </div>
    )
}