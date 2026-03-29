import { PadlockIcon } from "@/assets/icons/PadlockIcon"

export const HabitsPrivate = () => {
    return (
        <div className="habits-private">
            <PadlockIcon size="3.5rem" color="var(--mantine-color-gray-4)" />
            This member has their habits set to private.
        </div>
    )
}