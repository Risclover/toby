import { ArchivedIcon } from "@/assets";
import { PlusIcon } from "@/assets/icons/PlusIcon";
import { ActionIcon, Group, Tooltip } from "@mantine/core"
import { useNavigate } from "react-router-dom"

type Props = {
    openModal: () => void;
}
export const ShoppingListsTitleComponent = ({ openModal }: Props) => {
    const navigate = useNavigate();
    return (
        <div className="mobile-home-family-title">
            <h1>Shopping Lists</h1>
            <Tooltip.Group openDelay={500} closeDelay={100}>
                <Group gap="0.5rem" className="tasklists-title-right">
                    <Tooltip withArrow events={{ hover: true, focus: true, touch: false }} openDelay={500} closeDelay={100} label="Archive">
                        <ActionIcon size="md" radius="lg" variant="filled" color="white" c="rgb(5, 5, 73)" onClick={() => navigate("/shopping/archived")}>
                            <ArchivedIcon size="1.25rem" color="currentColor" />
                        </ActionIcon>
                    </Tooltip>
                    <Tooltip withArrow events={{ hover: true, focus: true, touch: false }} openDelay={500} closeDelay={100} label="Create list">
                        <ActionIcon size="md" radius="lg" variant="filled" color="white" c="rgb(5, 5, 73)" onClick={openModal}
                        >
                            <PlusIcon size="1.25rem" color="rgb(5, 5, 73)" />
                        </ActionIcon>
                    </Tooltip>
                </Group>
            </Tooltip.Group>
        </div>
    )
}