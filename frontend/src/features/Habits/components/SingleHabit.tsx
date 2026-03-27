import { PadlockIcon } from "@/assets/icons/PadlockIcon";
import { Checkbox } from "@mantine/core"
import { useState, type MouseEvent } from "react"
import { HabitMenu } from "./HabitMenu";
import { useCompleteHabitMutation, useDeleteHabitMutation, useUncompleteHabitMutation, type Habit } from "@/store";
import { DeleteConfirmation } from "@/features/HouseholdTasklists";

type Props = {
    habit: Habit;
    id: number;
    name: string;
    description?: string | null | undefined;
    color: string;
    isPrivate: boolean;
}

function hexToRgba(hex: string, alpha: number): string {
    if (!hex || !hex.startsWith("#")) return `rgba(0,0,0,${alpha})`;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const SingleHabit = ({ habit, id, name, description, color, isPrivate }: Props) => {
    const [checked, setChecked] = useState(habit.isCompletedToday);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [deleteHabit] = useDeleteHabitMutation();
    const [completeHabit] = useCompleteHabitMutation();
    const [uncompleteHabit] = useUncompleteHabitMutation();

    const handleToggle = async () => {
        if (habit.isCompletedToday) {
            await uncompleteHabit(habit.id).unwrap();
        } else {
            await completeHabit(habit.id).unwrap();
        }
    };

    const handleDelete = async () => {
        await deleteHabit(habit.id);
    }

    return (
        <div
            className="single-habit"
            style={{ borderLeft: `4px solid ${color}`, opacity: habit.isCompletedToday ? 0.7 : 1, transition: "opacity 0.15s" }}
        >
            <div className="single-habit-left" onClick={handleToggle} style={{ cursor: "pointer" }}>
                <div
                    style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        border: `1.5px solid ${color}`,
                        background: habit.isCompletedToday ? color : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        transition: "all 0.15s",
                    }}
                >
                    {habit.isCompletedToday && (
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="1.5,6 5,9.5 10.5,3" />
                        </svg>
                    )}
                </div>
            </div>

            <div className="single-habit-details">
                <div
                    className="single-habit-name"
                    style={{

                        color: habit.isCompletedToday ? "var(--mantine-color-dimmed)" : undefined,
                        textDecoration: habit.isCompletedToday ? "line-through" : "none",
                        transition: "all 0.15s",
                    }}
                >
                    {name}
                </div>
                {description && (
                    <div className="single-habit-description" style={{ opacity: habit.isCompletedToday ? 0.6 : 1 }}>
                        {description}
                    </div>
                )}
            </div>
            <div className="single-habit-right">
                {isPrivate && <PadlockIcon size="1.15rem" color="var(--mantine-color-red-5)" />}
                <HabitMenu setShowDeleteConfirmation={setShowDeleteConfirmation} habit={habit} />
            </div>
            {showDeleteConfirmation &&
                <div onClick={(e) => e.stopPropagation()}>
                    <DeleteConfirmation
                        modalTitle="Delete habit"
                        itemName={habit.name}
                        itemType="habit"
                        opened={showDeleteConfirmation}
                        setShowDeleteConfirmation={setShowDeleteConfirmation}
                        handleDeleteItem={handleDelete}
                    />
                </div>
            }
        </div>
    )
}