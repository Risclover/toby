import type { Task } from "@/store/taskSlice"
import { Checkbox } from "@mantine/core";
import "../../styles/HouseholdTasklists.css"

type Props = {
    task: Task;
    moveTask?: (dragIndex: number, hoverIndex: number) => void;
}

export const HouseholdTasklistTask = ({ task }: Props) => {
    return <li className="household-tasklist-task">
        <Checkbox
            size="xs"
            radius='xl'
            readOnly
            checked={false}
        />
        <div className="household-tasklist-task-title">
            {task.title}
        </div>
    </li>
}