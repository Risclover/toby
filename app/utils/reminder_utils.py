from datetime import datetime, date, time, timedelta, timezone
import pytz
from app.models import Reminder, ReminderAssignment, ReminderType
from app.extensions import db

def create_task_due_reminders(task):
    """
    Creates automatic reminders for a task with proper timezone handling.
    Rules:
    - Remind 3 days before due date (only if due date >= 3 days from now) and on the due date.
    - Assign to task.assigned_to_id if present; otherwise assign to all household members.
    - Do NOT create reminders in the past.
    - If a reminder already exists for the same source_entity and trigger date, do not duplicate.
    """
    if not task.due_date:
        return

    # Determine the timezone to use (assume assigned user, else creator, else UTC)
    from app.models import User
    if task.assigned_to_id:
        user = User.query.get(task.assigned_to_id)
    else:
        user = User.query.get(task.creator_id)

    try:
        user_tz = pytz.timezone(user.timezone or "UTC")
    except Exception:
        user_tz = pytz.UTC

    now_utc = datetime.utcnow().replace(tzinfo=pytz.UTC)
    household_users = [task.assigned_to_id] if task.assigned_to_id else [u.id for u in task.tasklist.household.members]

    # Calculate potential trigger dates in user's local timezone
    three_day_local = datetime.combine(task.due_date - timedelta(days=3), time.min)
    today_local = datetime.combine(task.due_date, time.min)

    # Localize to user's timezone
    three_day_localized = user_tz.localize(three_day_local)
    today_localized = user_tz.localize(today_local)

    # Convert to UTC for storage
    three_day_utc = three_day_localized.astimezone(pytz.UTC)
    today_utc = today_localized.astimezone(pytz.UTC)

    trigger_dates = []

    if three_day_utc >= now_utc:
        trigger_dates.append(three_day_utc)
    if today_utc >= now_utc:
        trigger_dates.append(today_utc)

    for trigger_at in trigger_dates:
        # Extra safety: skip past reminders
        if trigger_at < now_utc:
            continue

        # Avoid duplicates
        exists = Reminder.query.filter_by(
            household_id=task.tasklist.household_id,
            source_entity_type="task",
            source_entity_id=task.id,
            trigger_at=trigger_at,
            reminder_type=ReminderType.task_due,
        ).first()

        if exists:
            continue

        # Body text
        due_text = "today" if trigger_at.date() == task.due_date else "in 3 days"
        body = f"Task '{task.title}' is due {due_text}!"

        reminder = Reminder(
            household_id=task.tasklist.household_id,
            created_by_id=None,  # system-generated
            title=f'Task Due: {task.title}',
            body=body,
            reminder_type=ReminderType.task_due,
            is_automatic=True,
            source_entity_type="task",
            source_entity_id=task.id,
            trigger_at=trigger_at,
        )
        db.session.add(reminder)
        db.session.flush()  # get ID for assignments

        for user_id in household_users:
            db.session.add(
                ReminderAssignment(
                    reminder_id=reminder.id,
                    user_id=user_id,
                    seen=False
                )
            )

    db.session.commit()