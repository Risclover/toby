import { useIsSmallScreen } from "@/hooks";
import { useSettingsModal } from "@/hooks/useSettingsModal";
import { Modal } from "@mantine/core"
import { useForm } from "@mantine/form";

type Props = {
    opened: boolean;
    handleClose: () => void;
}
export const FeaturedListSettings = ({ opened, handleClose }: Props) => {
    const isSmallScreen = useIsSmallScreen();
    const initialValues = {
        list: ,

    }
    const form = useForm(
        initialValues,
    )
    const { showDiscardWarning, showDeleteConfirmation } = useSettingsModal();

    return (
        <Modal
            opened={opened}
            onClose={handleClose}
            title="Tasklist Settings"
            size="xl"
            radius="md"
            fullScreen={isSmallScreen}
            styles={{
                body: { display: "flex", flexDirection: "column", height: "100%", padding: 0, overflow: 'hidden' },
                content: { overflow: 'hidden', maxHeight: isSmallScreen ? "100%" : "700px", height: "100%", display: "flex", flexDirection: "column" }
            }}
            closeOnEscape={(!showDiscardWarning && !showDeleteConfirmation)}
        >

        </Modal>
    )
}