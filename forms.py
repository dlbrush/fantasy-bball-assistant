from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField
from wtforms.validators import InputRequired

class UserForm(FlaskForm):
    """
    Collects username and password for logging in or registering.
    """
    username = StringField('Username', validators=[InputRequired(message='Please enter a username.')])

    password = PasswordField('Password', validators=[InputRequired(message='Please enter a password.')])