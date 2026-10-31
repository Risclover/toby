from flask import Blueprint, request, jsonify, current_app
from flask_login import current_user, login_required
from app.extensions import db
from app.models import Notification, User
from datetime import date 

notification_routes = Blueprint("notifications", __name__)