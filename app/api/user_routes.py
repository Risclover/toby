"""
[] update mood
[] daily checkin
[] track habit
[] create habit
[] update display name
[] update tagline
[] update points
"""

from flask import Blueprint 
from app.models import User
from app.extensions import db

import datetime

user_routes = Blueprint('users', __name__)

@user_routes.route("/")
def get_all_users():
    """
    Fetch all users
    """
    users = User.query.all()
    return {"Users": [user.to_dict() for user in users]}, 200

@user_routes.route("/<int:id>") # ex: /users/1
def get_user(id):
    """
    Fetch specific user by id
    """
    user = User.query.get(id)
    return user.to_dict()

@user_routes.route("/<int:id>", methods=["PUT"])
def update_user_details(id):
    """
    Update details of specific user (by id), including display name, tagline, mood, and daily checkin
    """
    user = User.query.get(id)
    data = request.get_json() 

    mood = data["mood"]
    tagline = data["tagline"]
    display_name = data["display_name"]
    checkin = data["checkin"]

    setattr(user, "mood", mood)
    setattr(user, "tagline", tagline)
    setattr(user, "display_name", display_name)
    
    db.session.commit()

    return {"user": user.to_dict()}


@user_routes.route("/<int:id>/checkin", methods=["PUT"])
def user_checkin(id):
    """
    Check in user for daily checkin
    """
    user = User.query.get(id)
    if not user:
        return {"error": "User not found"}, 404

    # Reset daily_checkin if the last check-in is not today
    if user.last_checkin != datetime.date.today():
        user.daily_checkin = False

    # Only allow check-in if not already done today
    if user.daily_checkin:
        return {"message": "Already checked in today"}

    user.daily_checkin = True
    user.last_checkin = datetime.date.today()
    user.points = (user.points or 0) + 10
    db.session.commit()

    return {"message": "User daily checkin successful"}
