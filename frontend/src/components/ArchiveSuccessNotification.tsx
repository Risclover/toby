import { Button, Notification } from "@mantine/core"

export const ArchiveSuccessNotification = () => {
    return (
        <Notification title="Tasklist successfully archived!">
            <Button className="tasklist-settings-footer-btn" color="cyan">Undo</Button>
        </Notification>
    )
}