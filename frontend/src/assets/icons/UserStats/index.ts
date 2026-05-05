import { CheckCalendarIcon } from "./CheckCalendarIcon";
import { CheckCircleAltIcon } from "./CheckCircleAltIcon";
import { CheckClipboardIcon } from "./CheckClipboardIcon";
import { FlameIcon } from "./FlameIcon";
import { LoopIcon } from "./LoopIcon";
import { MonthCalendarIcon } from "./MonthCalendarIcon";
import { PieChartIcon } from "./PieChartIcon";
import { PostAddIcon } from "./PostAddIcon";
import { RisingChartIcon } from "./RisingChartIcon";
import { StreakFlameIcon } from "./StreakFlameIcon";
import { TrophyIcon } from "./TrophyIcon";
import { UserCheckIcon } from "./UserCheckIcon";
import { UserClipboardIcon } from "./UserClipboardIcon";
import { WarningClipboardIcon } from "./WarningClipboardIcon";
import { WeekCalendarIcon } from "./WeekCalendarIcon";

export const UserStatIcons = {
    LongestCheckinStreak: TrophyIcon,
    TotalCheckinsAllTime: UserCheckIcon,
    TotalWeeksPerfectCheckins: WeekCalendarIcon,
    CurrentCheckinStreak: FlameIcon,
    CheckinRate30Days: RisingChartIcon,

    TasksCompletedAllTime: CheckCalendarIcon,
    TasksCreated: PostAddIcon,
    OverdueTasksResolved: WarningClipboardIcon,
    TasksCompletedMonth: MonthCalendarIcon,
    TasksAssignedAllTime: UserClipboardIcon,

    BestHabitStreak: StreakFlameIcon,
    MostConsistentHabit: LoopIcon,
    AverageDailyHabitRate: PieChartIcon,
    HabitCompletionRateMonth: CheckCircleAltIcon,
    PerfectHabitDays: CheckClipboardIcon
}