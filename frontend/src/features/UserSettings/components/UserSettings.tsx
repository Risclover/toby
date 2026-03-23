import { useGetUserSettingsQuery } from "@/store/userSettingsSlice"
import { Modal } from "@mantine/core"

export const UserSettings = ({ opened, close }: { opened: boolean; close: () => void; }) => {
    const { data: userSettings } = useGetUserSettingsQuery()

    console.log('userSettings:', userSettings)
    return (
        <Modal opened={opened} onClose={close} title="User Settings" size="md" radius="md">
            Hi
        </Modal>
    )
}