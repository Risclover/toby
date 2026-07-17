import { TextInput, ActionIcon, CloseIcon } from "@mantine/core"

type Props = {
    name: string;
    onCommit: (name: string) => void;
}

export const ShoppingListDetailNameInput = ({ name, onCommit }: Props) => {
    return (
        <div className="shopping-list-detail-name-input">
            <TextInput
                value={name}
                onChange={(e) => onCommit(e.currentTarget.value)}
                placeholder="Item name"
                maxLength={100}
                rightSection={
                    name.length > 0 && (
                        <ActionIcon
                            type="button"
                            variant="subtle"
                            color="var(--mantine-color-gray-6)"
                            size="xs"
                            onClick={() => onCommit("")}
                        >
                            <CloseIcon size=".9rem" color="var(--mantine-color-gray-6)" />
                        </ActionIcon>
                    )
                }
            />
        </div>
    )
}