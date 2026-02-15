from flask import Blueprint, current_app, jsonify, request
from app.models import User, Checkin, Task, Tasklist, Reminder, ReminderAssignment
from flask_login import current_user, login_required
from sqlalchemy import or_
from app.extensions import db
from app.s3_helpers import (
    upload_file_to_s3, allowed_file, get_unique_filename)
from datetime import datetime, date, timedelta
from zoneinfo import ZoneInfo 
from pytz import all_timezones  # for validating IANA timezones


user_routes = Blueprint('users', __name__)

def today_local_date():
    tzid = getattr(current_app.config, "DEFAULT_TZID", "America/Los_Angeles")
    return datetime.now(ZoneInfo(tzid)).date()

def _d(s: str | None):
    return date.fromisoformat(s) if s else None  # expects "YYYY-MM-DD"

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



@user_routes.route("/<int:user_id>/checkins")
def get_user_checkins(user_id):
    # default: last 365 days (inclusive)
    dto   = _d(request.args.get("to"))   or date.today()
    dfrom = _d(request.args.get("from")) or (dto - timedelta(days=365))

    rows = (Checkin.query
            .filter(Checkin.user_id == user_id,
                    Checkin.local_date >= dfrom,
                    Checkin.local_date <= dto)
            .order_by(Checkin.local_date.asc())
            .all())

    # Heatmap-friendly: return just the dates (and add a verbose variant if you like)
    return jsonify({
        "userId": user_id,
        "from": dfrom.isoformat(),
        "to": dto.isoformat(),
        "dates": [c.local_date.isoformat() for c in rows]
    }), 200

@user_routes.route("/<int:user_id>/checkins", methods=["POST"])
def check_in_today(user_id):
    if user_id != current_user.id: abort(403)
    tld = today_local_date()
    exists = Checkin.query.filter_by(user_id=user_id, local_date=tld).first()
    if not exists:
        db.session.add(Checkin(user_id=user_id, local_date=tld))
        db.session.commit()
    return jsonify({"checkedInToday": True, "localDate": tld.isoformat()})



@user_routes.route("/<int:id>/img/<type>", methods=["POST"])
@login_required
def upload_image(id, type):
    if "image" not in request.files:
        return {"errors": "image required"}, 400

    image = request.files["image"]

    if not allowed_file(image.filename):
        return {"errors": "file type not permitted"}, 400

    image.filename = get_unique_filename(image.filename)

    upload = upload_file_to_s3(image)

    if "url" not in upload:
        return upload, 400

    url = upload["url"]
    # flask_login allows us to get the current user from the request
    user = User.query.get(id)

    if type == "profile":
        setattr(user, "profile_img", url)
    elif type == "banner":
        setattr(user, "banner_img", url)

    db.session.commit()
    return {"url": url}


@user_routes.route("/<int:id>/mood")
def get_user_mood(id):
    user = User.query.get(id)
    mood = user.user_mood.mood if user and user.user_mood else None
    return jsonify(user.to_dict_with_mood()), 200

@user_routes.route("/<int:id>/featured-list", methods=['PATCH'])
@login_required
def update_featured_list(id):
    # Ensure 'id' matches the variable in the route decorator
    user = User.query.get_or_404(id)

    # Security check (Good job adding this!)
    if current_user.id != user.id:
        return jsonify({ "error": "Unauthorized" }), 403

    # Ensure we actually have JSON data
    data = request.get_json()
    if not data:
        return jsonify({"error": "Missing JSON body"}), 400

    list_id = data.get('listId')

    if not list_id:
        return jsonify({"error": "No list ID provided"}), 400
    
    # Toggle logic
    if user.featured_tasklist_id == list_id:
        user.featured_tasklist_id = None 
    else:
        user.featured_tasklist_id = list_id 
    
    db.session.commit()

    return jsonify({
        "message": "Featured list updated",
        "featuredTasklistId": user.featured_tasklist_id
    }), 200

@user_routes.route("/<int:id>/task_stats")
def get_task_stats(id):
    try:
        # 1. Establish the timeframe based on 'right now'
        today = date.today()
        soon_date = today + timedelta(days=7)

        # 2. Query Tasks joined with Tasklist
        # Filter: (Assigned to User OR Unassigned) AND (Not Completed) AND (List is Active)
        pending_tasks = Task.query.join(Tasklist).filter(
            or_(Task.assigned_to_id == id, Task.assigned_to_id == None),
            Task.completed_at == None,
            Tasklist.is_archived == False
        ).all()

        stats = {
            "overdue": 0,
            "due_today": 0,
            "due_soon": 0
        }

        # 3. Categorize tasks
        # Using string comparisons for SQLite stability
        today_str = str(today)
        soon_str = str(soon_date)

        for t in pending_tasks:
            if t.due_date:
                t_due = str(t.due_date)
                
                if t_due < today_str:
                    stats["overdue"] += 1
                elif t_due == today_str:
                    stats["due_today"] += 1
                elif today_str < t_due <= soon_str:
                    stats["due_soon"] += 1
        
        return jsonify(stats), 200

    except Exception as e:
        print(f"Stats Error for User {id}: {e}")
        return jsonify({"error": str(e)}), 500

@user_routes.route("/<int:user_id>/reminders", methods=["GET"])
@login_required
def get_user_reminders(user_id):
    if current_user.id != user_id:
        return jsonify({"error": "Forbidden"}), 403

    now = datetime.utcnow()

    assignments = (
        ReminderAssignment.query
        .join(Reminder)
        .filter(
            ReminderAssignment.user_id == user_id,
            ReminderAssignment.seen.is_(False),
            Reminder.is_active.is_(True),
            or_(
                Reminder.trigger_at.is_(None),
                Reminder.trigger_at <= now,
            ),
        )
        .order_by(Reminder.trigger_at.asc().nulls_last())
        .all()
    )

    return jsonify([
        assignment.reminder.to_dict_for_user(assignment)
        for assignment in assignments
    ]), 200

@user_routes.route("/me/timezone", methods=["PUT"])
def update_user_timezone():
    user = User.query.get(current_user.id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json() or {}
    timezone = (data.get("timezone") or "").strip()

    # Validate timezone
    if timezone not in all_timezones:
        return jsonify({"error": "Invalid timezone"}), 400

    user.timezone = timezone
    db.session.commit()

    return jsonify(user.to_dict()), 200