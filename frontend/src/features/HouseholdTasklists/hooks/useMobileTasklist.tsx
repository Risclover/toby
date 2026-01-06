import { type Todo } from "@/store/todoSlice";
import { useCallback, useState } from "react";

type Props = {
    initialTasks: Todo[] | undefined;
}

export const useMobileTasklist = ({ initialTasks }: Props) => {
    const [tasks, setTasks] = useState<Todo[] | undefined>(initialTasks)

    const moveTask = useCallback((dragIndex: number, hoverIndex: number) => {
        if (!initialTasks || hoverIndex < 0 || hoverIndex >= initialTasks.length) return;

        setTasks(prevTasks => {
            if (!prevTasks) return prevTasks;
            const newTasks = [...prevTasks];
            const [removed] = newTasks.splice(dragIndex, 1);
            newTasks.splice(hoverIndex, 0, removed);
            return newTasks;
        });
    }, [initialTasks]);

    return { tasks, moveTask }
}