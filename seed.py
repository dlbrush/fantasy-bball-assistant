from models import db, bcrypt, User, Team, TeamPlayer, OpponentTeam, OpponentTeamPlayer
from app import app

# Drop all existing tables and start them from scratch.
db.drop_all()
db.create_all()

# Register a test user and commit so we can use the username as a foreign key
testuser = User.register(username='testuser', password='testing')
db.session.add(testuser)
db.session.commit()

# Give them a team and commit so we can use the ID as a foreign key
champs = Team(name='Champions', owner=testuser.username, league='Game of Zones')
db.session.add(champs)
db.session.commit()

# Place a player (LeBron James) on the team.
lebron = TeamPlayer(team_id=champs.id, player_id=2544)

# Create an opposing team
opp = OpponentTeam(name='Losers', plays_against=champs.id)

# Commit both so we can use the opponent ID as a foreign key
db.session.add_all([lebron, opp])
db.session.commit()

# Place a player (Hassan Whiteside) on the opponent's team and commit
theworst = OpponentTeamPlayer(opp_team_id=opp.id, player_id=202355)
db.session.add(theworst)
db.session.commit()
