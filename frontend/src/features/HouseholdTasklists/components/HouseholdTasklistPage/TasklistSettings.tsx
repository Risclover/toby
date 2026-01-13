import { Modal } from "@mantine/core"

type Props = {
    opened: boolean;
    handleClose: () => void;
}
export const TasklistSettings = ({ opened, handleClose }: Props) => {
    return (
        <Modal opened={opened} onClose={handleClose} title="Tasklist Settings" centered keepMounted={false}>

        </Modal>
    )
}