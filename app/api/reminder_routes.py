from flask import Blueprint, request, jsonify, abort
from flask_login import current_user
from app.extensions import db
from app.models import Reminder, User, Household
from datetime import datetime, timedelta, timezone 

reminder_routes = Blueprint("reminders", __name__)

@reminder_routes.route("/<int:id>", methods=["GET"])
def get_reminder(id):
    """
    Fetch specific reminder by id
    """
    reminder = Reminder.query.get(id)

    if not reminder:
        abort(404, description="Reminder not found")

    return jsonify(reminder.to_dict()), 200