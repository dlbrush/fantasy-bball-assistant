from unittest import TestCase

from flask import session
from app import app
from models import db, User, Team, OpponentTeam, TeamPlayer, OpponentTeamPlayer
from forms import UserForm

app.config['TESTING'] = True
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql:///fba_test'
app.config['DEBUG_TB_HOSTS'] = ['dont-show-debug-toolbar']
app.config['SQLALCHEMY_ECHO'] = False
app.config['DEBUG_TB_INTERCEPT_REDIRECTS'] = False

db.drop_all()
db.create_all()

class TestRoutes(TestCase):

    def setUp(self):
        """
        Delete existing users and teams, register a test user and test team and post to
        the db, and save the ID to this test instance for easy reference
        """
        User.query.delete()
        Team.query.delete()
        OpponentTeam.query.delete()

        user = User.register(username='testuser', password='testing')
        other_user = User.register(username='othertest', password='testing')
        db.session.add_all([user, other_user])
        db.session.commit()

        team = Team.create(name='Team', league='League', owner=user.username)
        other_team = Team.create(name='Others', league='Terrible', owner=other_user.username)

        team.add_players(['2544'])

        opp_team = OpponentTeam.create(name='Opponent', plays_against=team.id)
        other_opp = OpponentTeam.create(name='Other Opponent', plays_against=other_team.id)

        opp_team.add_players(['202355'])

        self.user = user
        self.other_user = other_user
        self.team = team
        self.team_player_ids = [player.player_id for player in team.players]
        self.other_team = other_team
        self.opp_team = opp_team
        self.opp_team_player_ids = [player.player_id for player in opp_team.players]
        self.other_opp = other_opp
        self.opp_team_id = opp_team.id
        self.other_opp_id = other_opp.id

    def tearDown(self):
        """
        Rollback any transaction that didn't get committed
        """
        db.session.rollback()

    def test_register_user(self):
        """
        Test that the User register method returns a User class and hashes the passed password
        """
        new_user = User.register(username = 'fake', password='notreal')

        self.assertIsInstance(new_user, User)
        self.assertNotEqual(new_user.password, 'notreal')

    def test_authenticate_user(self):
        """
        Test that when a username and password that are accurate are passed to the authenticate method,
        the user instance from the database is returned.
        """
        user = User.authenticate(username='testuser', password='testing')

        self.assertIsInstance(user, User)
        self.assertEqual(user, self.user)

    def test_serialize_user(self):
        """
        Test that a serialized user returns the username and a list of associated teams.
        """
        serialized = self.user.serialize()

        self.assertEqual(serialized['username'], 'testuser')
        self.assertEqual(serialized['teams'][0]['name'], 'Team')

    def test_create_team(self):
        """
        Test that we successfully return a new team committed to the database when a team is created
        """
        team = Team.create(name='NewTeam', league='League', owner=self.user.username)

        self.assertIsInstance(team, Team)
        self.assertIn(team, Team.query.all())
        self.assertEqual(team.user, self.user)

    def test_edit_team(self):
        """
        Test that we can successfully change all properties of a team
        """
        self.team.edit(name='Teamzzz', league='Super League', players=['1', '2'])

        self.assertEqual(self.team.name, 'Teamzzz')
        self.assertEqual(self.team.league, 'Super League')
        self.assertEqual(self.team.players[0].player_id, 1)

    def test_update_players(self):
        """
        Confirm that the new list of players matches the list of players associated with a team after players are added, removed, or kept the same.
        """

        #Test adding
        self.team.update_players(['2544', '23', '123'])
        player_ids = [player.player_id for player in self.team.players]
        self.assertListEqual(player_ids, [2544, 23, 123])

        #Test removing
        self.team.update_players(['2544'])
        player_ids = [player.player_id for player in self.team.players]
        self.assertListEqual(player_ids, [2544])

        #Test holding the same
        self.team.update_players(['2544'])
        player_ids = [player.player_id for player in self.team.players]
        self.assertListEqual(player_ids, [2544])

    def test_add_players(self):
        """
        Confirm that the player IDs passed are added the players associated with the team
        """
        self.team.add_players(['4356'])
        player_ids = [player.player_id for player in self.team.players]
        self.assertIn(4356, player_ids)

    def test_remove_players(self):
        """
        Confirm that the player IDs passed are removed from the players associated with the team
        """
        self.team.remove_players(['2544'])
        player_ids = [player.player_id for player in self.team.players]
        self.assertNotIn(2544, player_ids)

    def test_serialize_team(self):
        """
        Confirm that when a team is serialized, its id, name, and league are returned
        """
        serialized = self.team.serialize()
        self.assertEqual(serialized['id'], self.team.id)
        self.assertEqual(serialized['name'], self.team.name)
        self.assertEqual(serialized['league'], self.team.league)

    def test_create_opp_team(self):
        """
        Test that we successfully return a new opponent team committed to the database when a team is created
        """
        opp_team = OpponentTeam.create(name='NewTeam', plays_against=self.team.id)

        self.assertIsInstance(opp_team, OpponentTeam)
        self.assertIn(opp_team, OpponentTeam.query.all())
        self.assertIn(opp_team, self.team.opponents)

    def test_edit_opp_team(self):
        """
        Test that we can successfully change all properties of an opponent's team
        """
        self.opp_team.edit(name='Teamzzz', players=['1', '2'])

        self.assertEqual(self.opp_team.name, 'Teamzzz')
        self.assertEqual(self.opp_team.players[0].player_id, 1)

    def test_update_opp_players(self):
        """
        Confirm that the new list of players matches the list of players associated with a team after players are added, removed, or kept the same.
        """

        #Test adding
        self.opp_team.update_players(['2544', '23', '123'])
        player_ids = [player.player_id for player in self.opp_team.players]
        self.assertListEqual(player_ids, [2544, 23, 123])

        #Test removing
        self.opp_team.update_players(['2544'])
        player_ids = [player.player_id for player in self.opp_team.players]
        self.assertListEqual(player_ids, [2544])

        #Test holding the same
        self.opp_team.update_players(['2544'])
        player_ids = [player.player_id for player in self.opp_team.players]
        self.assertListEqual(player_ids, [2544])

    def test_add_opp_players(self):
        """
        Confirm that the player IDs passed are added the players associated with the team
        """
        self.opp_team.add_players(['4356'])
        player_ids = [player.player_id for player in self.opp_team.players]
        self.assertIn(4356, player_ids)

    def test_remove_opp_players(self):
        """
        Confirm that the player IDs passed are removed from the players associated with the team
        """
        self.opp_team.remove_players(['2544'])
        player_ids = [player.player_id for player in self.opp_team.players]
        self.assertNotIn(2544, player_ids)

    def test_serialize_opp_team(self):
        """
        Confirm that when an opponent's team is serialized, its id, name, and league are returned
        """
        serialized = self.opp_team.serialize()
        self.assertEqual(serialized['id'], self.opp_team.id)
        self.assertEqual(serialized['name'], self.opp_team.name)