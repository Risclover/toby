import type { Task } from '@/store/taskSlice';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
dayjs.extend(isBetween);

type Props = {
    tasks: Task[] | undefined;
}

export const getTaskStats = ({ tasks }: Props) => {
    const now = dayjs();
    const todayStart = now.startOf('day');
    const todayEnd = now.endOf('day');
    const tomorrowStart = now.add(1, 'day').startOf('day');
    const sevenDaysOutEnd = now.add(7, 'days').endOf('day');

    return {
        // 1. Overdue: Anything before 12:00 AM today (and not finished)
        overdue: tasks?.filter(t =>
            t.dueDate &&
            dayjs(t.dueDate).isBefore(todayStart) &&
            t.status !== 'completed'
        ).length,

        // 2. Due Today: Anything between 12:00 AM and 11:59 PM today
        dueToday: tasks?.filter(t =>
            t.dueDate &&
            dayjs(t.dueDate).isBetween(todayStart, todayEnd, null, '[]')
        ).length,

        // 3. Due Soon: Starts tomorrow morning, ends in 7 days
        dueSoon: tasks?.filter(t =>
            t.dueDate &&
            dayjs(t.dueDate).isBetween(tomorrowStart, sevenDaysOutEnd, null, '[]')
        ).length,
    };
};