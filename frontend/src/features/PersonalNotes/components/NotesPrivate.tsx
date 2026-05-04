import { PadlockIcon } from "@/assets/icons/PadlockIcon"

/** Notes private state */
export const NotesPrivate = () => {
    return (
        <div className="habits-private">
            <PadlockIcon size="3.5rem" color="var(--mantine-color-gray-4)" />
            This user has their notes set to private.
        </div>
    )
}