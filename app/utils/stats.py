from collections import defaultdict
from datetime import datetime, timedelta

from sqlalchemy import func as sa_func

from app.extensions import db
from app.models.checkin import Checkin
from app.models.habit import Habit
from app.models.task import Task
from app.utils.timezone import get_month_bounds_utc, get_user_timezone


def _longest_streak(dates: list) -> int:
    if not dates:
        return 0
    max_s = current_s = 1
    for i in range(1, len(dates)):
        if (dates[i] - dates[i - 1]).days == 1:
            current_s += 1
            if current_s > max_s:
                max_s = current_s
        else:
            current_s = 1
    return max_s


def _current_streak(dates: list, today) -> int:
    if not dates:
        return 0
    streak = 0
    expected = today
    for d in reversed(dates):
        if d == expected:
            streak += 1
            expected -= timedelta(days=1)
        elif d < expected:
            break
    return streak


def compute_user_stats(user) -> dict:
    user_tz = get_user_timezone(user)
    today_local = datetime.now(user_tz).date()
    start_of_month_local = today_local.replace(day=1)
    days_elapsed = (today_local - start_of_month_local).days + 1
    start_utc, end_utc = get_month_bounds_utc(user)

    # ─── Tasks ───────────────────────────────────────────────────────────────

    tasks_completed = Task.query.filter(
        Task.completed_by_id == user.id
    ).count()

    tasks_created = Task.query.filter(
        Task.creator_id == user.id
    ).count()

    tasks_assigned = Task.query.filter(
        Task.assigned_to_id == user.id
    ).count()

    tasks_completed_month = Task.query.filter(
        Task.completed_by_id == user.id,
        Task.completed_at >= start_utc,
        Task.completed_at < end_utc,
    ).count()

    overdue_resolved = Task.query.filter(
        Task.completed_by_id == user.id,
        Task.completed_at.isnot(None),
        Task.due_date.isnot(None),
        Task.due_date < sa_func.date(Task.completed_at),
    ).count()

    # ─── Check-ins ───────────────────────────────────────────────────────────

    ci_rows = (
        Checkin.query
        .filter_by(user_id=user.id)
        .with_entities(Checkin.local_date)
        .all()
    )
    checkin_dates = sorted([r.local_date for r in ci_rows])

    longest_ci_streak = _longest_streak(checkin_dates)
    current_ci_streak = _current_streak(checkin_dates, today_local)
    total_checkins = len(checkin_dates)

    thirty_ago = today_local - timedelta(days=29)
    if checkin_dates:
        first_checkin = checkin_dates[0]
        total_days = (today_local - first_checkin).days + 1
        overall_checkin_rate = round(total_checkins / total_days * 100)
    else:
        overall_checkin_rate = 0

    week_day_sets = defaultdict(set)
    for d in checkin_dates:
        iso = d.isocalendar()
        week_day_sets[(iso[0], iso[1])].add(iso[2])
    perfect_weeks_count = sum(1 for days in week_day_sets.values() if len(days) == 7)

    # ─── Habits ──────────────────────────────────────────────────────────────

    habits = (
        Habit.query
        .filter_by(user_id=user.id)
        .options(db.joinedload(Habit.completions))
        .all()
    )

    best_habit_streak = 0
    best_habit_name = None
    best_habit_rate = -1.0
    completions_this_month_total = 0
    active_habits = [h for h in habits if h.is_active]
    completions_by_date = defaultdict(int)

    for habit in habits:
        habit_dates = sorted([c.local_date for c in habit.completions])

        best_habit_streak = max(best_habit_streak, _longest_streak(habit_dates))

        if habit.created_at:
            days_old = (today_local - habit.created_at.date()).days
            if days_old >= 7:
                rate = len(habit_dates) / days_old
                if rate > best_habit_rate or (rate == best_habit_rate and habit.is_active):
                    best_habit_rate = rate
                    best_habit_name = habit.name

        if habit.is_active:
            completions_this_month_total += sum(
                1 for d in habit_dates
                if start_of_month_local <= d <= today_local
            )

        for d in habit_dates:
            completions_by_date[d] += 1

    habit_rate_month = (
        round(completions_this_month_total / (len(active_habits) * days_elapsed) * 100)
        if active_habits and days_elapsed > 0
        else 0
    )

    avg_daily_rate = 0
    perfect_habit_days = 0

    if habits:
        first_habit_created = min(
            h.created_at.date() for h in habits if h.created_at
        )
        total_rate = 0.0
        day_count = 0
        cursor = first_habit_created

        while cursor <= today_local:
            active_on_day = sum(
                1 for h in active_habits
                if h.created_at and h.created_at.date() <= cursor
            )
            if active_on_day > 0:
                completed_on_day = completions_by_date.get(cursor, 0)
                total_rate += completed_on_day / active_on_day
                day_count += 1
                if completed_on_day == active_on_day:
                    perfect_habit_days += 1
            cursor += timedelta(days=1)

        avg_daily_rate = round((total_rate / day_count * 100) if day_count > 0 else 0)

    return {
        "tasksCompleted": tasks_completed,
        "tasksCreated": tasks_created,
        "tasksCompletedThisMonth": tasks_completed_month,
        "longestCheckinStreak": longest_ci_streak,
        "currentCheckinStreak": current_ci_streak,
        "totalCheckins": total_checkins,
        "checkinRate30Days": overall_checkin_rate,
        "bestHabitStreak": best_habit_streak,
        "habitRateThisMonth": habit_rate_month,
        "perfectHabitDays": perfect_habit_days,
    }