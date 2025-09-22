import type { Todo } from "@/store/todoSlice";
import { Drawer, Transition } from "@mantine/core"

type Props = {
    opened: boolean;
    close: () => void;
    task: any;
}

export const TaskDetails = ({ opened, close, task }: Props) => {
    return <Drawer transitionProps={{ duration: 200, transition: 'fade-down' }} opened={opened} position="right" onClose={close} title="Edit Task">

        {task.title}

    </Drawer>
}