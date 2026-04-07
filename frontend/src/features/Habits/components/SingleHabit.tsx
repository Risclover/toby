import { PadlockIcon } from "@/assets/icons/PadlockIcon";
import { Checkbox } from "@mantine/core"
import { useState, type MouseEvent } from "react"
import { HabitMenu } from "./HabitMenu";
import { useCompleteHabitMutation, useDeleteHabitMutation, useUncompleteHabitMutation, type Habit } from "@/store";
import { DeleteConfirmation } from "@/features/HouseholdTasklists";
import { notifications } from "@mantine/notifications";
import { showHabitIncompleteToast } from "../utils/showHabitIncompleteToast";
import { showHabitCompleteToast } from "../utils/showHabitCompleteToast";
import { KittyNotification } from "@/components/KittyNotification";
import { KittyIcons } from "@/assets";

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
        try {
            if (habit.isCompletedToday) {
                await uncompleteHabit(habit.id).unwrap();
                KittyNotification({
                    title: "Habit marked incomplete",
                    message: <>"<strong style={{ fontWeight: 500 }}>{name}</strong>" has returned. Go show it who's boss!</>,
                    color: "rgb(154, 221, 166)",
                    icon: KittyIcons.Frustrated
                })
                setChecked(false);
            } else {
                await completeHabit(habit.id).unwrap();
                KittyNotification({
                    title: "Habit completed",
                    message: <>"<strong style={{ fontWeight: 500 }}>{name}</strong>" is done for the day. Keep it up, champ!</>,
                    color: "rgb(154, 221, 166)",
                    icon: KittyIcons.Celebrate
                })

            }
        } catch (error) {
            KittyNotification({
                title: "Whoops - something went wrong",
                message: <>Couldn't change the status of "<strong style={{ fontWeight: 500 }}>{name}</strong>". Refresh and try again.</>,
                color: "rgb(220, 80, 80)",
                icon: KittyIcons.Cry
            })
        }
    };

    const handleDelete = async () => {
        try {
            await deleteHabit(habit.id).unwrap();
            KittyNotification({
                title: "Habit deleted",
                message: <>Done - "<strong style={{ fontWeight: 500 }}>{habit.name}</strong>" has been removed from your habits. Sayonara!</>,
                color: "rgb(154, 221, 166)",
                icon: KittyIcons.Wave
            })
        } catch (error) {
            KittyNotification({
                title: "Whoops - something went wrong",
                message: <>Couldn't delete "<strong style={{ fontWeight: 500 }}>{habit.name}</strong>". Refresh and try again.</>,
                color: "rgb(220, 80, 80)",
                icon: KittyIcons.Pout
            });
            console.error("Failed to delete habit:", error);
        }
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