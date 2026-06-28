import { TextInput, ActionIcon } from "@mantine/core"
import { IconX } from "@tabler/icons-react"

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
                            color="gray"
                            size="sm"
                            onClick={() => onCommit("")}
                        >
                            <IconX size={14} />
                        </ActionIcon>
                    )
                }
            />
        </div>
    )
}