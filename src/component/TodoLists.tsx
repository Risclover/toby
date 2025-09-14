import { useEffect } from "react";
import { useGetTodoListsQuery } from "../store/todoSlice";
import { TodoList } from "./TodoList";

export const TodoLists = () => {
    const { data: lists, isLoading, error } = useGetTodoListsQuery();

    useEffect(() => {
        console.log('lists:', lists);
    }, [lists]);

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error loading todo lists</div>;
    return (
        <div>
            {lists?.map((list) => (
                <TodoList list={list} />
            ))}

        </div>
    );
};
