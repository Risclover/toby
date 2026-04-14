from app.models import Household
from app.extensions import db
from sqlalchemy import text

def seed_households():
    household = Household(
        name="The Sara Family",
        admin_id=1
    )
    db.session.add(household)
    db.session.commit()

def undo_households():
    db.session.execute(text("DELETE FROM households"))
    db.session.commit()