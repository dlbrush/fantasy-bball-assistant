from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt

db = SQLAlchemy()

bcrypt = Bcrypt()

def connect_db(app):
    """Connect the app to the database"""

    db.app = app
    db.init_app(app)

class User(db.Model):
    """User's name and password in the database."""

    __tablename__ = 'users'

    username = db.Column(
        db.String,
        primary_key = True,
        unique = True
    )

    password = db.Column(
        db.String,
        nullable = False
    )

    teams = db.relationship('Team', backref='user', cascade='all,delete')

    @classmethod
    def register(cls, username, password):
        """
        Create a hash of the user's password and store that to a User instance to be stored in the database.
        """
        hashed = bcrypt.generate_password_hash(password)
        hashed_text = hashed.decode('utf8')
        return cls(username=username, password=hashed_text)

class Team(db.Model):
    """
    A team associated with a user.
    This model only stores the name and associated user,
    players are associated with a team through the TeamPlayer model.
    """

    __tablename__ = 'teams'

    id = db.Column(
        db.Integer,
        primary_key = True,
        autoincrement = True
    )

    name = db.Column(
        db.String
        nullable = False
    )

    owner = db.Column(
        db.String,
        db.ForeignKey('users.username'),
        nullable = False
    )

    league = db.Column(
        db.String
    )

    players = db.relationship('TeamPlayer', backref='team', cascade='all,delete')

class TeamPlayer(db.Model):
    """
    Associates a player ID with a team ID, meaning that player is on that team.
    Player ID comes from the API and is not a foreign key in this database.
    """
    __tablename__ = 'teams_players'

    team_id = db.Column(
        db.Integer,
        db.ForeignKey('teams.id'),
        primary_key = True
    )

    player_id = db.Column(
        db.Integer,
        primary_key = True
    )



class OpponentTeam(db.Model):
    """
    A team of players that plays against one of the user's teams.
    This model only stores the name and associated user,
    players are associated with a team through the OpponentTeamPlayer model.
    """

    __tablename__ = 'opponent_teams'

    id = db.Column(
        db.Integer,
        primary_key = True,
        autoincrement = True
    )

    plays_against = db.Column(
        db.Integer,
        db.ForeignKey('teams.id'),
        nullable = False
    )

    name = db.Column(
        db.String,
        nullable = False
    )

    players = db.relationship('OpponentTeamPlayer', backref='team', cascade='all,delete')

class OpponentTeamPlayer(db.Model):
    """
    Associates a player ID with an opponent team ID, meaning that player is on that team.
    Player ID comes from the API and is not a foreign key in this database.
    """

    __tablename__ = 'opponent_teams_players'

    opp_team_id = db.Column(
        db.Integer,
        db.ForeignKey('opponent_teams.id'),
        primary_key = True
    )

    player_id = db.Column(
        db.Integer,
        primary_key = True
    )
