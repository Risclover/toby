from flask import Blueprint, current_app, jsonify, request
from flask_login import current_user, login_required
from app.extensions import db

habit_routes = Blueprint("habits", __name__)

