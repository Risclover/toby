import { Combobox, ComboboxChevron, NumberInput, Select } from '@mantine/core'
import React from 'react'

export const ItemExpanded = ({ item }) => {
    return (
        <div className="shopping-item-expanded">
            <div className="shopping-item-expanded-input-section">
                <label htmlFor={`quantity-${item.id}`}>Qty:</label>
                <NumberInput

                    id={`quantity-${item.id}`}
                    name="quantity"
                    min={1}
                    thousandSeparator=","
                    defaultValue={item.quantity || 1}
                    styles={{
                        wrapper: { width: '80px', background: 'var(--main-background)', borderColor: 'var(--main-border)', borderRadius: "0.5rem", overflow: "hidden" },
                        input: { width: '80px', background: 'var(--main-background)', color: 'white', borderColor: 'var(--main-border)', borderRadius: "0.5rem", overflow: "hidden" }
                    }}
                />
            </div>
            <div className="shopping-item-expanded-input-section">
                <label htmlFor={`category-${item.id}`}>Category:</label>
                <Select
                    id={`category-${item.id}`}
                    name="category"
                    defaultValue={item.quantity || 1}
                    styles={{
                        wrapper: { width: "100%", border: "1px solid var(--main-border)", borderRadius: "0.5rem" },
                        input: {
                            fontFamily: "Nunito Sans, sans-serif",
                            borderRadius: "0.5rem",
                            border: 0,
                            width: "100%",
                            paddingLeft: "2.5rem",
                            paddingTop: "1rem",
                            paddingBottom: "1rem",
                            background: "var(--main-background)",
                            color: "white"
                        },
                        section: { background: "transparent" },
                        dropdown: { background: "var(--main-background)", border: "1px solid white", borderRadius: "0.5rem" },
                        options: { background: "var(--main-background)", color: "white" },
                    }}
                />
            </div>
        </div>
    )
}
