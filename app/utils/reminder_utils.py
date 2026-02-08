from datetime import datetime, date, time, timedelta, timezone
from app.models import Reminder, ReminderAssignment, ReminderType
from app.extensions import db

def create_task_due_reminders(task):
    """
    Creates automatic reminders for a task.
    Rules:
    - Remind 3 days before due date (only if due date >= 3 days from now) and on the due date.
    - Assign to task.assigned_to_id if present; otherwise assign to all household members.
    - Do NOT create reminders in the past.
    - If a reminder already exists for the same source_entity and trigger date, do not duplicate.
    """
    if not task.due_date:
        return

    now = datetime.now(timezone.utc)
    household_users = [task.assigned_to_id] if task.assigned_to_id else [u.id for u in task.tasklist.household.members]

    # Calculate potential trigger dates
    three_day_trigger = datetime.combine(task.due_date - timedelta(days=3), time.min, tzinfo=timezone.utc)
    today_trigger = datetime.combine(task.due_date, time.min, tzinfo=timezone.utc)

    trigger_dates = []

    # Only add 3-day reminder if due date is at least 3 days from now
    if three_day_trigger >= now:
        trigger_dates.append(three_day_trigger)

    # Always add "today" reminder if due date is today or in the future
    if today_trigger >= now:
        trigger_dates.append(today_trigger)

    for trigger_at in trigger_dates:
        # Skip reminders in the past (extra safety)
        if trigger_at < now:
            continue

        # Check for existing reminder
        exists = Reminder.query.filter_by(
            household_id=task.tasklist.household_id,
            source_entity_type="task",
            source_entity_id=task.id,
            trigger_at=trigger_at,
            reminder_type=ReminderType.task_due,
        ).first()

        if exists:
            continue

        # Determine body text
        if trigger_at.date() == task.due_date:
            due_text = "today"
        else:
            due_text = "in 3 days"

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