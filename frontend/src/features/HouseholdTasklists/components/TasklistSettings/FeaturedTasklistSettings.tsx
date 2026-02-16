import { useIsSmallScreen } from "@/hooks"
import { Modal } from "@mantine/core"

type Props = {
    opened: boolean;
    setShowFeaturedListSettings: (val: boolean) => void;
}

export const FeaturedTasklistSettings = ({ opened, setShowFeaturedListSettings }: Props) => {
    const isSmallScreen = useIsSmallScreen();

    const handleClose = () => {
        setShowFeaturedListSettings(false);
    }


    return (
        <Modal
            opened={opened}
            onClose={handleClose}
            title="Featured list settings"
            size="xl"
            radius="md"
            fullScreen={isSmallScreen}
        >

        </Modal>
    )
}