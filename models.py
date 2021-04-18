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

    teams = db.relationship('Team', backref='user', passive_deletes=True)

    @classmethod
    def register(cls, username, password):
        """
        Create a hash of the user's password and store that to a User instance to be stored in the database.
        """
        hashed = bcrypt.generate_password_hash(password)
        hashed_text = hashed.decode('utf8')
        return cls(username=username, password=hashed_text)

    @classmethod
    def authenticate(cls, username, password):
        user = User.query.filter_by(username = username).first()

        if user and bcrypt.check_password_hash(user.password, password):
            return user
        else:
            return False

    def serialize(self):
        """
        Returns dictionary of user info to send as JSON to the session.
        """
        return {
            'username': self.username,
            'teams': [team.serialize() for team in self.teams]
        }

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
        db.String,
        nullable = False
    )

    owner = db.Column(
        db.String,
        db.ForeignKey('users.username', ondelete="CASCADE"),
        nullable = False
    )

    league = db.Column(
        db.String
    )

    players = db.relationship('TeamPlayer', backref='team', passive_deletes=True)

    @classmethod
    def create(cls, name, league, owner):
        new_team = cls(name=name, league=league, owner=owner)
        db.session.add(new_team)
        db.session.commit()
        return new_team

    def edit(self, name, league, players):
        self.name = name
        self.league = league
        db.session.commit()
        self.update_players(new_player_list=players)
    
    def update_players(self, new_player_list):
        """
        Determines which players to add or remove from the players associated with this team.
        Add players from the list who are not already associated with this team.
        Remove players who are not in the list but are associated with this team.
        """
        new_player_ints = [int(player) for player in new_player_list]
        self_player_ids = [player.player_id for player in self.players]
        to_add = [player for player in new_player_ints if player not in self_player_ids]
        to_remove = [player for player in self_player_ids if player not in new_player_ints]
        self.add_players(to_add)
        self.remove_players(to_remove)

    def add_players(self, player_ids):
        """
        Creates an association between the team and all players in the list of player IDs passed
        """
        for player_id in player_ids:
            team_player = TeamPlayer(team_id=self.id, player_id=int(player_id))
            db.session.add(team_player)
        db.session.commit()

    def remove_players(self, player_ids):
        """
        Removes association between the team and all players in the list of player IDs passed
        """
        for player_id in player_ids:
            TeamPlayer.query.filter_by(team_id=self.id, player_id=player_id).delete()
        db.session.commit()

    def serialize(self):
        """
        Returns a dictionary of team info that we want to send as JSON.
        """
        return {
            'id': self.id,
            'name': self.name,
            'league': self.league
        }

class TeamPlayer(db.Model):
    """
    Associates a player ID with a team ID, meaning that player is on that team.
    Player ID comes from the API and is not a foreign key in this database.
    """
    __tablename__ = 'teams_players'

    team_id = db.Column(
        db.Integer,
        db.ForeignKey('teams.id', ondelete="CASCADE"),
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
        db.ForeignKey('teams.id', ondelete="CASCADE"),
        nullable = False
    )

    name = db.Column(
        db.String,
        nullable = False
    )

    players = db.relationship('OpponentTeamPlayer', backref='team', passive_deletes=True)

class OpponentTeamPlayer(db.Model):
    """
    Associates a player ID with an opponent team ID, meaning that player is on that team.
    Player ID comes from the API and is not a foreign key in this database.
    """

    __tablename__ = 'opponent_teams_players'

    opp_team_id = db.Column(
        db.Integer,
        db.ForeignKey('opponent_teams.id', ondelete="CASCADE"),
        primary_key = True
    )

    player_id = db.Column(
        db.Integer,
        primary_key = True
    )
