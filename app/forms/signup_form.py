from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField
from wtforms.validators import DataRequired, ValidationError, Email, Length, Optional
from app.models import User

def user_exists(form, field):
    # Checking if user exists
    email = field.data
    user = User.query.filter(User.email == email).first()
    if user:
        raise ValidationError('That email address is already associated with an account.')

def username_exists(form, field):
    # Checking if username is already in use
    username = field.data
    user = User.query.filter(User.username == username).first()
    if user:
        raise ValidationError('that username is already taken')

class SignUpForm(FlaskForm):
    username = StringField(
        'username', validators=[DataRequired(), Length(min=3, max=80), username_exists])
    email = StringField('email', validators=[DataRequired(), Email(), Length(max=254), user_exists])
    password = PasswordField('password', validators=[DataRequired(), Length(min=8)])

class SignUpWithHouseholdForm(SignUpForm):
    household_name = StringField('household_name', validators=[DataRequired(), Length(max=120)])

class SignUpNoHouseholdForm(SignUpForm):
    # field optional (or omit the field entirely if it truly isn’t used)
    household_name = StringField('household_name', validators=[Optional(), Length(max=120)])