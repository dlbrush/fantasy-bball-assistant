from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SelectMultipleField
from wtforms.validators import InputRequired

class UserForm(FlaskForm):
    """
    Collects username and password for logging in or registering.
    """
    username = StringField('Username', validators=[InputRequired(message='Please enter a username.')])

    password = PasswordField('Password', validators=[InputRequired(message='Please enter a password.')])

class TeamBuilderForm(FlaskForm):
    """
    Collects the name and league name for a team, and allows the user to choose the players on their team.
    """
    name = StringField('Team Name', validators=[InputRequired(message='Please enter a team name.')])

    league = StringField('League Name (Optional)')

class OppTeamBuilderForm(FlaskForm):
    """
    Collects the name for an opponent's team, and allows the user to choose the players on that team.
    """
    name = StringField('Team Name', validators=[InputRequired(message='Please enter a team name.')])
