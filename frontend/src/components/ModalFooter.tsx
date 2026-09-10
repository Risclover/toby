import { Modal } from "@mantine/core"
import type { ReactNode } from "react"

type Props = {
    children: ReactNode;
    borderTop?: string;
}

export const ModalFooter = ({ borderTop, children }: Props) => {
    return (
        <Modal.Header
            component={'footer'}
            pos={'sticky'}
            bottom={0}
            style={{
                borderRadius: 0,
                borderTop: borderTop
            }}
        >
            {children}
        </Modal.Header>
    )
}