import { NumberInput } from "@mantine/core"

type Props = {
    quantity: number;
    onCommit: (q: number) => void;
}
export const ShoppingListAddItemQuantity = ({ quantity, onCommit }: Props) => {
    return (
        <div className="shopping-list-add-item-detail--popover">
            <NumberInput
                stepHoldDelay={500}
                stepHoldInterval={100}
                allowNegative={false}
                value={quantity}
                max={9999}
                clampBehavior="strict"
                onChange={(value) => onCommit(Number(value))}
                styles={{
                    wrapper: {
                        display: "flex",
                        overflow: "hidden",
                        width: "100px",
                    },
                    input: {
                        minWidth: 0,
                        flex: 1,
                    },
                    controls: {
                        borderRadius: 0,
                        flexShrink: 0,
                    },
                }}
            />
        </div>
    )
}