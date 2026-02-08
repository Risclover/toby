import { useGetUserRemindersQuery, type ReminderType } from "@/store/reminderSlice"
import { Reminder } from "./Reminder";
import { useState, useMemo } from "react"; // Added useMemo
import { CreateReminder } from "./CreateReminder";
import { ScrollArea } from "@mantine/core";

type Props = {
    userId: number;
}

export const Reminders = ({ userId }: Props) => {
    const [scrollPos, setScrollPos] = useState({ x: 0, isEnd: false });

    // ... (Your scroll/mask logic remains the same) ...
    const handleScroll = ({ x }: { x: number }) => {
        setScrollPos((prev) => ({ ...prev, x }));
    };

    const getMask = () => {
        const showLeft = scrollPos.x > 20;
        const showRight = !scrollPos.isEnd;

        if (showLeft && showRight) {
            return 'linear-gradient(to right, transparent, black 8%, black 95%, transparent)';
        } else if (showLeft) {
            return 'linear-gradient(to right, transparent, black 8%)';
        } else if (showRight) {
            return 'linear-gradient(to left, transparent, black 8%)';
        }
        return 'none';
    };

    const [showCreateReminder, setShowCreateReminder] = useState(false);
    const { data: reminders = [] } = useGetUserRemindersQuery(userId);
    console.log('reminders:', reminders);
    // FIX: Create a sorted copy of the reminders
    // We use slice() to copy the array, then reverse() or sort()
    // useMemo prevents re-sorting on every single render unless reminders change
    const sortedReminders = useMemo(() => {
        return reminders
            .slice() // Create a shallow copy so we don't mutate the Redux state
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [reminders]);

    return (
        <div className="reminders-container announcement-mask-container">
            <ScrollArea scrollbarSize={8} w="100%" offsetScrollbars className="scroll-mask" style={{ '--mask-edges': getMask() } as any}
                onScrollPositionChange={handleScroll}
                viewportRef={(ref) => {
                    if (ref) {
                        const isAtEnd = ref.scrollLeft + ref.clientWidth >= ref.scrollWidth - 20;
                        if (isAtEnd !== scrollPos.isEnd) {
                            setScrollPos(p => ({ ...p, isEnd: isAtEnd }));
                        }
                    }
                }}
                styles={{
                    content: {
                        display: 'flex',
                        flexDirection: 'row',
                        flexWrap: 'nowrap',
                        gap: '1rem',
                    }
                }
                }>
                {/* Use sortedReminders instead of reminders */}
                {sortedReminders.map((reminder: ReminderType) => (
                    <Reminder reminder={reminder} reminderId={reminder.id} key={reminder.id} />
                ))}
            </ScrollArea>
        </div>
    )
}
