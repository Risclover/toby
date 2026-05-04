import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@mantine/core"

import { FaChevronLeft } from "react-icons/fa6"
import { PadlockIcon } from "@/assets/icons/PadlockIcon"

/** Message on user profiles when notes are set to private */
export const SingleNotePrivate = () => {
    const navigate = useNavigate();
    const { userId } = useParams();

    const handleNavigateBackToNotes = () => {
        navigate(`/profile/${userId}?tab=notes`)
    }

    return (
        <div className="habits-private">
            <PadlockIcon size="3.5rem" color="var(--mantine-color-gray-4)" />
            This user has set this note to private.
            <Button
                onClick={handleNavigateBackToNotes}
                leftSection={<FaChevronLeft size=".75rem" />}
                color="rgb(5, 5, 73)"
                fw={500}
            >
                Go back to notes
            </Button>
        </div>
    )
}