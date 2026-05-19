from flask import Blueprint, request, session, redirect, abort, current_app, jsonify
from flask_login import current_user, login_user, logout_user, login_required
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import func
from app.utils.activity_service import ActivityService

from app.models import User, Household, ShoppingList
from app.extensions import db
from app.forms import LoginForm
from app.helpers import validation_errors_to_error_messages
from uuid import uuid4
import requests

auth_routes = Blueprint('auth', __name__)

@auth_routes.route('')
def authenticate():
    """
    Authenticates a user.
    """
    if current_user.is_authenticated:
        return current_user.to_dict()
    return {'errors': ['Unauthorized']}

@auth_routes.route('/google', methods=['POST'])
def google_login():
    access_token = request.json.get('access_token')
    invite_code = request.json.get('invite_code')  # add this
    if not access_token:
        return jsonify({'error': 'Access token required'}), 400

    response = requests.get(
        'https://www.googleapis.com/oauth2/v1/userinfo',
        headers={'Authorization': f'Bearer {access_token}'}
    )
    if not response.ok:
        return jsonify({'error': 'Invalid token'}), 401

    google_user = response.json()
    sub = google_user['id']
    email = google_user['email'].strip().lower()

    user = User.query.filter_by(google_id=sub).first()
    if not user:
        user = User.query.filter(func.lower(User.email) == email).first()
        if user:
            user.google_id = sub
        else:
            user = User(
                first_name=google_user.get('given_name', ''),
                last_name=google_user.get('family_name', ''),
                email=email,
                profile_img=google_user.get("picture", ""),
                timezone="America/Los_Angeles",
                google_id=sub,
            )
            db.session.add(user)

    # Join household atomically if invite code provided and user has none yet
    if invite_code and not user.household_id:
        household = Household.query.filter_by(invite_code=invite_code).first()
        if household:
            user.household_id = household.id

    db.session.commit()
    login_user(user)
    return jsonify(user.to_dict()), 200

@auth_routes.route('/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    if not email or not password:
        return jsonify({'errors': ['Email and password are required']}), 400

    user = (User.query
        .filter(func.lower(User.email) == email)
        .first())

    if user is None or not check_password_hash(user.hashed_password, password):
        # don’t leak which part failed
        return jsonify({'errors': ['Incorrect email/password combination']}), 401

    # optional: block disabled users
    # if not user.is_active:
    #     return jsonify({'errors': ['Account disabled']}), 403

    login_user(user)  # safe: user is real and has is_active via UserMixin
    return jsonify(user.to_dict()), 200


@auth_routes.route('/logout')
def logout():
    """
    Logs a user out
    """
    logout_user()
    return {'message': 'User logged out'}


@auth_routes.route("/signup/check-email/<string:email>", methods=["POST"])
def check_email(email):
    email_lower = email.lower()
    user = User.query.filter(func.lower(User.email) == email_lower).first()

    if user:
        return {"Message": True}
    else:
        return {"Message": False}

# --------------------------------------------------------------------------- #
#  Regular username / password signup
# --------------------------------------------------------------------------- #
@auth_routes.route("/signup", methods=["POST"])
def sign_up():
    """
    Signup a new user. Optionally create a household.
    """
    data = request.get_json()
    first_name = data.get("firstName")
    last_name = data.get("lastName")
    email = data.get("email")
    password = data.get("password")
    timezone = "America/Los_Angeles"
    household_name = data.get("household_name")  # optional

    # Create user first
    user = User(first_name=first_name, last_name=last_name, email=email, password=password, timezone=timezone)
    db.session.add(user)
    db.session.flush()  # flush to get user.id

    # If household_name provided, create household and assign user as member & creator
    household = None
    if household_name:
        household = Household(
            name=household_name,
            creator_id=user.id
        )
        db.session.add(household)
        db.session.flush()  # flush to get household.id
        user.household_id = household.id
        defaults = ["Groceries", "Necessities", "Wishlist"]
        db.session.add_all([
            ShoppingList(title=title, household_id=household.id, creator_id=user.id) for title in defaults
        ])
    db.session.commit()
    login_user(user)

    response = {
        "user": user.to_dict()
    }
    if household:
        response["household"] = household.to_dict()

    return jsonify(response), 201

@auth_routes.route("/join/<string:invite_code>", methods=["POST"])
def join_household(invite_code):
    """
    Join a household using an invite code.
    """
    data = request.get_json()
    first_name = data.get("firstName")
    last_name = data.get("lastName")
    email = data.get("email")
    password = data.get("password")

    household = Household.query.filter_by(invite_code=invite_code).first()
    if not household:
        return jsonify({"error": "Invalid invite code"}), 400

    # Create user and assign to household
    user = User(
        first_name=first_name,
        last_name=last_name,
        email=email,
        password=password,
        household_id=household.id
    )
    db.session.add(user)
    db.session.commit()
    login_user(user)

    return jsonify({
        "user": user.to_dict(),
        "household": household.to_dict()
    }), 201

@auth_routes.route("/join/<string:invite_code>", methods=["GET"])
def validate_invite(invite_code):
    household = Household.query.filter_by(invite_code=invite_code).first() 

    if not household:
        return jsonify({"error": "Invalid invite code"}), 404
        
    return jsonify({
        "householdId": household.id,
        "householdName": household.name,
    }), 200

@auth_routes.route("/households/<int:household_id>/invite", methods=["POST"])
@login_required
def generate_invite(household_id):
    """
    Generate invite code for household (creator only)
    """
    household = Household.query.get(household_id)
    if not household:
        return jsonify({"error": "Household not found"}), 404

    # Generate UUID as invite code
    invite_code = str(uuid4())
    household.invite_code = invite_code
    db.session.commit()

    return jsonify({"invite_code": invite_code}), 200


@auth_routes.route('/unauthorized')
def unauthorized():
    """
    Returns unauthorized JSON when flask-login authentication fails
    """
    return {'errors': ['Unauthorized']}, 401

@auth_routes.route("/household/create", methods=["POST"])
@login_required
def create_household():
    data = request.get_json()
    household_name = data.get("household_name")
    if not household_name:
        return jsonify({"error": "Household name required"}), 400

    household = Household(name=household_name, admin_id=current_user.id)
    db.session.add(household)
    db.session.flush()
    current_user.household_id = household.id
    defaults = ["Groceries", "Necessities", "Wishlist"]
    db.session.add_all([
        ShoppingList(title=title, household_id=household.id, creator_id=current_user.id) for title in defaults
    ])
    db.session.commit()
    return jsonify({"user": current_user.to_dict(), "household": household.to_dict()}), 201


@auth_routes.route("/household/join/<string:invite_code>", methods=["POST"])
@login_required
def join_existing_household(invite_code):
    household = Household.query.filter_by(invite_code=invite_code).first()
    if not household:
        return jsonify({"error": "Invalid invite code"}), 400

    current_user.household_id = household.id
    db.session.commit()
    return jsonify({"user": current_user.to_dict(), "household": household.to_dict()}), 200