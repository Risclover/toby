import { useGetShoppingListQuery } from "@/store/shoppingSlice";
import { Card, Progress } from "@mantine/core";
import { useNavigate } from "react-router-dom";

type Props = {
    list: { id: number; title: string; items: any[] };
}

export const ShoppingList = ({ list }: Props) => {
    const navigate = useNavigate();

    console.log('list items:', list.items);

    const handleClick = () => {
        navigate(`/shopping/${list.id}`);
    }
    return (
        <Card className="household-tasklist"
            shadow="sm"
            padding="lg"
            radius="md"
            withBorder
            onClick={handleClick}
        >
            <h2 className="tasklist-head">{list.title}</h2>
            {/* <div className="progress">
                <div className="progress-left">
                    <Progress color="cyan" value={percent} />
                </div>
                {percent}%
            </div>

            {uncompletedTodos?.slice(0, 3).map((todo: any) => (
                <HouseholdTasklistTask key={todo.id} task={todo} />
            ))}

            {remainingCount > 0 && <Divider my="md" />}

            {remainingCount > 0 && (
                <div className="household-tasklist-bottom">
                    + {remainingCount} more task{remainingCount > 1 && "s"}
                </div>
            )} */}
        </Card>
    )
}