import { Avatar, Tooltip } from "@mantine/core"

export const MobileHomeFamilyTitle = () => {
    return (
        <div className="mobile-home-family-title">
            The Sara Family

            <Avatar.Group spacing="lg">
                <Tooltip label="Sara" withArrow>
                    <Avatar src="https://i.pravatar.cc/150?img=1" alt="Sara" radius="xl" />
                </Tooltip>
                <Tooltip label="John" withArrow>
                    <Avatar src="https://i.pravatar.cc/150?img=2" alt="John" radius="xl" />
                </Tooltip>
                <Tooltip label="Emma" withArrow>
                    <Avatar src="https://i.pravatar.cc/150?img=3" alt="Emma" radius="xl" />
                </Tooltip>
                <Avatar>+3</Avatar>
            </Avatar.Group>
        </div>
    )
}