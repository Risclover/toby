from datetime import date
from app.extensions import db
from app.models import Reminder, ReminderAssignment, RepeatFrequency
import calendar

def reset_repeating_reminders(app):
    with app.app_context():
        today = date.today()

        repeating_reminders = (
            Reminder.query
            .filter(
                Reminder.repeat_frequency.isnot(None),
                Reminder.is_active.is_(True),
                Reminder.trigger_date.isnot(None),
                Reminder.trigger_date <= today,
            )
            .all()
        )

        for reminder in repeating_reminders:
            if _is_due_today(reminder, today):
                for assignment in reminder.assignments:
                    assignment.seen = False

        db.session.commit()


def _is_due_today(reminder, today):
    trigger = reminder.trigger_date
    if trigger == today:
        return False

    days_since = (today - trigger).days

    if reminder.repeat_frequency == RepeatFrequency.DAILY:
        return days_since % 1 == 0

    if reminder.repeat_frequency == RepeatFrequency.WEEKLY:
        return days_since % 7 == 0

    if reminder.repeat_frequency == RepeatFrequency.MONTHLY:
        last_day_of_month = calendar.monthrange(today.year, today.month)[1]
        effective_day = min(trigger.day, last_day_of_month)
        return today.day == effective_day

    return False