import { PadlockIcon } from "@/assets/icons/PadlockIcon"
import { Button } from "@mantine/core"
import { FaBackspace } from "react-icons/fa"
import { FaBackward, FaChevronLeft, FaLeftLong } from "react-icons/fa6"
import { useNavigate, useParams } from "react-router-dom"

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
            <Button onClick={handleNavigateBackToNotes} leftSection={<FaChevronLeft size=".75rem" />} color="rgb(5, 5, 73)" fw={500}>Go back to notes</Button>
        </div>
    )
}