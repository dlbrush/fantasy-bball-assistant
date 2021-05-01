from unittest import TestCase

from flask import session
from app import app
from models import db, User, Team, OpponentTeam
from forms import UserForm

app.config['TESTING'] = True
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql:///fba_test'
app.config['DEBUG_TB_HOSTS'] = ['dont-show-debug-toolbar']
app.config['SQLALCHEMY_ECHO'] = False
app.config['DEBUG_TB_INTERCEPT_REDIRECTS'] = False
app.config['WTF_CSRF_ENABLED'] = False

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
        """Rollback any transaction that didn't get committed"""
        db.session.rollback()

    def test_root_redirect(self):
        """
        First, test that this route takes you to the login page by default.
        Then, with a user in session, test that you're redirected to your user hub.
        """
        with app.test_client() as client:
            #Testing redirect to login page
            response1 = client.get('/', follow_redirects=True)
            html1 = response1.get_data(as_text=True)

            self.assertEqual(response1.status_code, 200)
            self.assertIn('<h1>Log In</h1>', html1)

            #Testing redirect to user hub when user is in session
            with client.session_transaction() as sess:
                db.session.add(self.user)
                sess['user'] = self.user.serialize()

            response2 = client.get('/', follow_redirects=True)
            html2 = response2.get_data(as_text=True)

            self.assertEqual(response2.status_code, 200)
            self.assertIn('<h1>Welcome, testuser!</h1>', html2)

    def test_show_login_form(self):
        """
        First, test that the expected login form renders on the get route where the form does not validate.
        Then, test that the form validates and sends the user to their hub if they successfully log in.
        """
        with app.test_client() as client:
            #Test showing login form on get route
            response1 = client.get('/login')
            html1 = response1.get_data(as_text=True)

            self.assertEqual(response1.status_code, 200)
            self.assertIn('<h1>Log In</h1>', html1)

            # Test successful login
            data = {
                'username': 'testuser',
                'password': 'testing'
            }

            response2 = client.post('/login', data=data, follow_redirects=True)
            html2 = response2.get_data(as_text=True)

            self.assertIn('user', session)
            self.assertEqual(response2.status_code, 200)
            self.assertIn('<h1>Welcome, testuser!</h1>', html2)

            #  #Testing redirect to user hub when user is in session
            response3 = client.get('/login', follow_redirects=True)
            self.assertEqual(response3.status_code, 200)

    def test_show_registration_form(self):
        """
        First, test that the expected registrtion form renders on the get route where the form does not validate.
        Then, test that the form validates and sends them to create a team if they successfully log in.
        """
        with app.test_client() as client:
            #Test showing registration form on get route
            response1 = client.get('/register')
            html1 = response1.get_data(as_text=True)

            self.assertEqual(response1.status_code, 200)
            self.assertIn('<h1>Create an account</h1>', html1)

            # Test failed register with repeat username
            data = {
                'username': 'testuser',
                'password': 'testing'
            }

            response2 = client.post('/register', data=data)
            html2 = response2.get_data(as_text=True)

            self.assertEqual(response2.status_code, 200)
            self.assertIn('Username already taken!', html2)

            # Test successful register without username
            data = {
                'username': 'testuser2',
                'password': 'testing'
            }

            response3 = client.post('/register', data=data, follow_redirects=True)
            html3 = response3.get_data(as_text=True)

            self.assertIn('user', session)
            self.assertEqual(response3.status_code, 200)
            self.assertIn('Welcome to the Fantasy Basketball Assistant!', html3)

    def test_logout_user(self):
        """
        Test that the user is removed from the session and
        redirected to the login form on logout.
        """
        with app.test_client() as client:

            with client.session_transaction() as sess:
                db.session.add(self.user)
                sess['user'] = self.user.serialize()

            response = client.get('/logout', follow_redirects=True)
            html = response.get_data(as_text=True)

            self.assertNotIn('user', session)
            self.assertEqual(response.status_code, 200)
            self.assertIn('<h1>Log In</h1>', html)

    def test_show_user_hub(self):
        """
        Test that the user is successfully shown their own userhub if their name is in the session.
        If they are logged in as someone else, redirect to that user hub.
        If they are not logged in, redirect to the login form.
        """
        with app.test_client() as client:
            # Test redirect to login with no user in session
            response1 = client.get('/testuser', follow_redirects=True)
            html1 = response1.get_data(as_text=True)

            self.assertEqual(response1.status_code, 200)
            self.assertIn('<h1>Log In</h1>', html1)

            #Test user hub with user in session
            with client.session_transaction() as sess:
                db.session.add(self.user)
                sess['user'] = self.user.serialize()
            
            response2 = client.get('/testuser')
            html2 = response2.get_data(as_text=True)

            self.assertEqual(response2.status_code, 200)
            self.assertIn('<h1>Welcome, testuser!</h1>', html2)

            #Test redirect to own user hub when trying to access a different user
            response3 = client.get('/othertest', follow_redirects=True)
            html3 = response3.get_data(as_text=True)

            self.assertEqual(response3.status_code, 200)
            self.assertIn('<h1>Welcome, testuser!</h1>', html3)

    def test_show_team_builder(self):
        """
        1. Test redirect to login if the user is not logged in.
        2. Test redirect to user hub if the user is not logged in as the user in the route.
        3. Test showing team builder form if the user is logged in.
        4. Test successful submit and redirect on post route.
        """
        with app.test_client() as client:
            # Test redirect to login with no user in session
            response1 = client.get('/testuser/addteam', follow_redirects=True)
            html1 = response1.get_data(as_text=True)

            self.assertEqual(response1.status_code, 200)
            self.assertIn('<h1>Log In</h1>', html1)

            #Test user hub with user in session
            with client.session_transaction() as sess:
                db.session.add(self.user)
                sess['user'] = self.user.serialize()
            
            response2 = client.get('/testuser/addteam')
            html2 = response2.get_data(as_text=True)

            self.assertEqual(response2.status_code, 200)
            self.assertIn('<h2>Add a team</h2>', html2)

            #Test redirect to own team builder when trying to access a different user
            response3 = client.get('/othertest/addteam', follow_redirects=True)
            html3 = response3.get_data(as_text=True)

            self.assertEqual(response3.status_code, 200)
            self.assertIn('<h2>Add a team</h2>', html3)

            #Test successful post route
            data = {
                'name': 'Team',
                'league': 'League',
                'players': ['2544']
            }

            response4 = client.post('/testuser/addteam', data=data, follow_redirects=True)
            html4 = response4.get_data(as_text=True)

            self.assertTrue(session['user']['teams'])
            self.assertEqual(response4.status_code, 200)
            self.assertIn('<h1>Team</h1>', html4)

    def test_show_team(self):
        """
        1. Test successful team view.
        2. Test show user hub when the user accesses a team that's not theirs.
        3. Test show user hub when the user goes to a route with a different user name.
        """
        with app.test_client() as client:

            other_id = self.other_team.id
            other_name = self.other_user.username

            # Test successful team view
            with client.session_transaction() as sess:
                sess['user'] = self.user.serialize()
            
            response1 = client.get(f'/{self.user.username}/teams/{self.team.id}')
            html1 = response1.get_data(as_text=True)

            self.assertEqual(response1.status_code, 200)
            self.assertIn(f'<h1>{self.team.name}</h1>', html1)

            #Test show user hub when the user accesses a team that's not theirs
            response2 = client.get(f'/{self.user.username}/teams/{other_id}', follow_redirects=True)
            html2 = response2.get_data(as_text=True)

            self.assertEqual(response2.status_code, 200)
            self.assertIn('Sorry, that team does not belong to you.', html2)

            #Test show user hub when the user goes to a route with a different user name.
            response3 = client.get(f'/{other_name}/teams/{other_id}', follow_redirects=True)
            html3 = response3.get_data(as_text=True)

            self.assertEqual(response3.status_code, 200)
            self.assertIn('Sorry, that is not your username.', html3)

    def test_edit_team(self):
        """
        Test that the team edit form shows on the get route when the user is logged in.
        Then, test that the post route validates and redirects to the team view.
        """
        with app.test_client() as client:
            with client.session_transaction() as sess:
                sess['user'] = self.user.serialize()
            
            response1 = client.get(f'/{self.user.username}/teams/{self.team.id}/edit')
            html1 = response1.get_data(as_text=True)

            self.assertEqual(response1.status_code, 200)
            self.assertIn(f'<h2>Edit {self.team.name}</h2>', html1)

            #Test successful post route
            data = {
                'name': 'Team Edited',
                'league': 'Leaguezzz',
                'players': ['2544', '202355']
            }

            response2 = client.post(f'/{self.user.username}/teams/{self.team.id}/edit', data=data, follow_redirects=True)
            html2 = response2.get_data(as_text=True)

            self.assertEqual(session['user']['teams'][0]['name'], 'Team Edited')
            self.assertEqual(response2.status_code, 200)
            self.assertIn('<h1>Team Edited</h1>', html2)

    def test_delete_team(self):
        """
        Test that a team is deleted when the user is logged in as the user who owns that team.
        """
        with app.test_client() as client:
            with client.session_transaction() as sess:
                sess['user'] = self.user.serialize()

            team_name = self.team.name
        
            response = client.post(f'/{self.user.username}/teams/{self.team.id}/delete', follow_redirects=True)
            html = response.get_data(as_text=True)

            self.assertEqual(response.status_code, 200)
            self.assertFalse(session['user']['teams'])
            self.assertNotIn(f'<h5 class="card-title">{team_name}</h5>', html)
            self.assertIn('<h1>Welcome, testuser!</h1>', html)

    def test_show_projections(self):
        """
        Test that the projection view is shown when the user is logged in and viewing their own team.
        """
        with app.test_client() as client:
            with client.session_transaction() as sess:
                sess['user'] = self.user.serialize()
            
            response = client.get(f'/{self.user.username}/teams/{self.team.id}/projections', follow_redirects=True)
            html = response.get_data(as_text=True)

            self.assertEqual(response.status_code, 200)
            self.assertIn(f'<h2>Weekly projections for {self.team.name}</h1>', html)

    def test_show_opp_team(self):
        """
        Test that the opponent's team is shown when the user is logged in and viewing an opponent of one of their teams.
        Also, test that the user is redirected to their user hub if the team is not an opponent.
        """
        with app.test_client() as client:
            with client.session_transaction() as sess:
                sess['user'] = self.user.serialize()
        
            response1 = client.get(f'/teams/{self.team.id}/opponents/{self.opp_team_id}')
            html1 = response1.get_data(as_text=True)

            self.assertEqual(response1.status_code, 200)
            self.assertIn(f'<h1>{self.opp_team.name}</h1>', html1)

            other_opp_id = self.other_opp.id

            response2 = client.get(f'/teams/{self.team.id}/opponents/{self.other_opp_id}', follow_redirects=True)
            html2 = response2.get_data(as_text=True)

            self.assertEqual(response2.status_code, 200)
            self.assertIn("Sorry, that&#39;s an opponent of another team.", html2)

    def test_show_opp_team_builder(self):
        """
        Test that we successfully show the opponent team builder when the user is logged in and owns the team in the route.
        Then, test that we redirect to the new opponent team view on successful post.
        """
        with app.test_client() as client:
            with client.session_transaction() as sess:
                sess['user'] = self.user.serialize()

            response1 = client.get(f'/teams/{self.team.id}/opponents/addteam')
            html1 = response1.get_data(as_text=True)

            self.assertEqual(response1.status_code, 200)
            self.assertIn('<h2>Add an opposing team</h2>', html1)

            data = {
                'name': 'Opponent2',
                'players': ['2544']
            }

            response2 = client.post(f'/teams/{self.team.id}/opponents/addteam', data=data, follow_redirects=True)
            html2 = response2.get_data(as_text=True)

            self.assertEqual(response2.status_code, 200)
            self.assertIn('<h1>Opponent2</h1>', html2)

    def test_edit_opp_team(self):
        """
        Test that we show the opponent team editor when the user is logged in and viewing a team that belongs to them.
        On successful post route, test that we redirect to the opponent team viewer.
        """
        with app.test_client() as client:
            with client.session_transaction() as sess:
                sess['user'] = self.user.serialize()
            
            response1 = client.get(f'/teams/{self.team.id}/opponents/{self.opp_team_id}/edit')
            html1 = response1.get_data(as_text=True)

            self.assertEqual(response1.status_code, 200)
            self.assertIn(f'<h2>Edit {self.opp_team.name}</h2>', html1)

            #Test successful post route
            data = {
                'name': 'Enemy',
                'players': ['2544', '202355']
            }

            response2 = client.post(f'/teams/{self.team.id}/opponents/{self.opp_team_id}/edit', data=data, follow_redirects=True)
            html2 = response2.get_data(as_text=True)

            self.assertEqual(response2.status_code, 200)
            self.assertIn('<h1>Enemy</h1>', html2)

    def test_delete_opp_team(self):
        """
        Test that when the user is logged in, owns the team in the route, and the opponent's team opposes that team, the team is deleted and the user is redirected to the team view.
        """
        with app.test_client() as client:
            with client.session_transaction() as sess:
                sess['user'] = self.user.serialize()

            opp_team_name = self.opp_team.name

            response = client.post(f'/teams/{self.team.id}/opponents/{self.opp_team_id}/delete', follow_redirects=True)
            html = response.get_data(as_text=True)

            self.assertEqual(response.status_code, 200)
            self.assertNotIn(f'{opp_team_name}</a>', html)

    def test_show_trade_analyzer(self):
        """
        Test that when the user is logged in, the trade analyzer displays.
        """
        with app.test_client() as client:
            with client.session_transaction() as sess:
                sess['user'] = self.user.serialize()
            
            response = client.get('/trade-analyzer')
            html = response.get_data(as_text=True)

            self.assertEqual(response.status_code, 200)
            self.assertIn('<h1>Trade Analyzer</h1>', html)

    def test_show_pickup_analyzer(self):
        """
        Test that when the user is logged in, the trade analyzer displays.
        """
        with app.test_client() as client:
            with client.session_transaction() as sess:
                sess['user'] = self.user.serialize()
            
            response = client.get('/pickup-analyzer')
            html = response.get_data(as_text=True)

            self.assertEqual(response.status_code, 200)
            self.assertIn('<h1>Pickup Analyzer</h1>', html)

    def test_get_user_teams(self):
        """
        Test that when a username is passed to the user team route, we get JSON with serialized data about the teams.
        """
        with app.test_client() as client:
            response = client.get(f'/data/{self.user.username}/teams')

            expected_data = {
                'teams': [self.team.serialize()]
            }

            self.assertEqual(expected_data, response.json)

    def test_get_user_team_players(self):
        """
        Test that when a team id is passed to the user team players route, we get JSON with a list of each player ID.
        """
        with app.test_client() as client:
            response = client.get(f'/data/teams/{self.team.id}/players')

            expected_data = {
                'players': self.team_player_ids
            }

            self.assertEqual(expected_data, response.json)

    def test_get_opp_team_players(self):
        """
        Test that when an opposing team ID is passed to this route, a JSON object containing the name and players associated are returned.
        """
        with app.test_client() as client:
            response = client.get(f'/data/oppteams/{self.opp_team_id}')

            expected_data = {
                'name': self.opp_team.name,
                'players': self.opp_team_player_ids
            }

            self.assertEqual(expected_data, response.json)
    




