from models import db, bcrypt, User, Team, TeamPlayer, OpponentTeam, OpponentTeamPlayer, Player
from app import app
from api import get_all_players

# Drop all existing tables and start them from scratch.
db.drop_all()
db.create_all()

# Seed all players
players = get_all_players()
for player in players:
    new_player = Player(first_name=player['first_name'], last_name=player['last_name'], id=player['id'])
    db.session.add(new_player)
db.session.commit()

# Register a test user and commit so we can use the username as a foreign key
testuser = User.register(username='testuser', password='testing')
db.session.add(testuser)
db.session.commit()

# Give them a team and commit so we can use the ID as a foreign key
champs = Team(name='Champions', owner=testuser.username, league='Game of Zones')
db.session.add(champs)
db.session.commit()

# Place a player (LeBron James) on the team.
lebron = TeamPlayer(team_id=champs.id, player_id=237)

# Create an opposing team
opp = OpponentTeam(name='Losers', plays_against=champs.id)

# Commit both so we can use the opponent ID as a foreign key
db.session.add_all([lebron, opp])
db.session.commit()

# Place a player (Hassan Whiteside) on the opponent's team and commit
theworst = OpponentTeamPlayer(opp_team_id=opp.id, player_id=474)
db.session.add(theworst)
db.session.commit()
