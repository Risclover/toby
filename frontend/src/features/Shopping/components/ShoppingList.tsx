import { Card, Divider, Progress } from "@mantine/core";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingListItem } from "./ShoppingListItem";

type Props = {
    list: { id: number; title: string; items: any[] };
}

export const ShoppingList = ({ list }: Props) => {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/shopping/${list.id}`);
    }

    const { percent } = useMemo(() => {
        const total = list.items.length;
        const done = list.items.filter((t: any) => t.purchased === true).length;
        const raw = total ? (done / total) * 100 : 0;
        const percent = Math.min(100, Math.max(0, Math.round(raw)));
        return { percent };
    }, [list.items]);

    const unpurchased = useMemo(() => {
        return list.items.filter((t: any) => t.purchased !== true);
    }, [list.items]);

    const remainingCount = Math.max(0, (unpurchased?.length ?? 0) - 3);

    return (
        <Card className="household-tasklist"
            shadow="sm"
            padding="lg"
            radius="md"
            withBorder
            onClick={handleClick}
        >
            <h2 className="tasklist-head">{list.title}</h2>
            <div className="progress">
                <div className="progress-left">
                    <Progress color="cyan" value={percent} />
                </div>
                {percent}%
            </div>

            {unpurchased?.slice(0, 3).map((todo: any) => (
                <ShoppingListItem key={todo.id} item={todo} />
            ))}

            {remainingCount > 0 && <Divider my="md" />}

            {remainingCount > 0 && (
                <div className="household-tasklist-bottom">
                    + {remainingCount} more item{remainingCount > 1 && "s"}
                </div>
            )}
        </Card>
    )
}