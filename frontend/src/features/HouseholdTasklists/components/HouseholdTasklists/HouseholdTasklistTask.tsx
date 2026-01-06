import type { Todo } from "@/store/todoSlice";
import { Checkbox } from "@mantine/core";


type Props = {
    task: Todo;
    moveTask?: (dragIndex: number, hoverIndex: number) => void;
}

export const HouseholdTasklistTask = ({ task }: Props) => {
    return <div className="household-tasklist-task">
        <Checkbox
            size="xs"
            radius='xl'
            readOnly
            checked={false}
        />
        {task.title}
    </div>
}