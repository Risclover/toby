from flask import Blueprint, request, session, redirect, abort, current_app, jsonify
from flask_login import current_user, login_user, logout_user, login_required
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import func

from app.models import User, Household, ShoppingList
from app.extensions import db
from app.forms import LoginForm
from app.helpers import validation_errors_to_error_messages
from uuid import uuid4


auth_routes = Blueprint('auth', __name__)

@auth_routes.route('/')
def authenticate():
    """
    Authenticates a user.
    """
    if current_user.is_authenticated:
        return current_user.to_dict()
    return {'errors': ['Unauthorized']}


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
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    household_name = data.get("household_name")  # optional

    # Create user first
    user = User(name=name, email=email, password=password)
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
            ShoppingList(title=title, household_id=household.id) for title in defaults
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
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    household = Household.query.filter_by(invite_code=invite_code).first()
    if not household:
        return jsonify({"error": "Invalid invite code"}), 400

    # Create user and assign to household
    user = User(
        name=name,
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
