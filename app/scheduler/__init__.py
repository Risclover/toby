from flask_apscheduler import APScheduler

scheduler = APScheduler()

def init_scheduler(app):
    scheduler.init_app(app)
    scheduler.add_job(
        id="reset_repeating_reminders",
        func="app.scheduler.reminder_scheduler:reset_repeating_reminders",
        trigger="cron",
        hour=0,
        minute=0,
        args=[app],
    )
    scheduler.start()