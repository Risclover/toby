from flask.cli import AppGroup
from .households import seed_households, undo_households
from .users import seed_users, undo_users


seed_commands = AppGroup('seed')

@seed_commands.command('all')
def seed():
    seed_users()
    seed_households()

@seed_commands.command('undo')
def undo():
    undo_households()
    undo_users()