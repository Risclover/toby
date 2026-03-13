from datetime import date, timedelta
from app.models import Reminder, ReminderAssignment, ReminderType
from app.extensions import db


def create_task_due_reminders(task):
    """
    Creates automatic reminders for a task.
    Rules:
    - Remind 3 days before due date (only if that date is today or in the future) and on the due date.
    - Assign to task.assigned_to_id if present; otherwise assign to all household members.
    - Do NOT create reminders in the past.
    - If a reminder already exists for the same source_entity and trigger date, do not duplicate.
    """
    if not task.due_date:
        return

    today = date.today()
    household_users = (
        [task.assigned_to_id]
        if task.assigned_to_id
        else [u.id for u in task.tasklist.household.members]
    )

    three_days_before = task.due_date - timedelta(days=3)

    trigger_dates = []
    if three_days_before >= today:
        trigger_dates.append(three_days_before)
    if task.due_date >= today:
        trigger_dates.append(task.due_date)

    for trigger_date in trigger_dates:
        exists = Reminder.query.filter_by(
            household_id=task.tasklist.household_id,
            source_entity_type="task",
            source_entity_id=task.id,
            trigger_date=trigger_date,
            reminder_type=ReminderType.TASK_DUE,
        ).first()

        if exists:
            continue

        due_text = "today" if trigger_date == task.due_date else "in 3 days"
        message = f"Task '{task.title}' is due {due_text}!"

        reminder = Reminder(
            household_id=task.tasklist.household_id,
            created_by_id=None,  # system-generated
            message=message,
            reminder_type=ReminderType.TASK_DUE,
            is_automatic=True,
            source_entity_type="task",
            source_entity_id=task.id,
            trigger_date=trigger_date,
            source_entity_metadata={"listId": task.list_id},
        )
        db.session.add(reminder)
        db.session.flush()  # get ID for assignments

        for user_id in household_users:
            db.session.add(
                ReminderAssignment(
                    reminder_id=reminder.id,
                    user_id=user_id,
                    seen=False,
                )
            )

    db.session.commit()
