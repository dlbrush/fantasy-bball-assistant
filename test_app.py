from unittest import TestCase
from app import app
from models import db, User, Team, OpponentTeam

app.config['TESTING'] = True
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql:///fba_test'
app.config['DEBUG_TB_HOSTS'] = ['dont-show-debug-toolbar']
app.config['SQLALCHEMY_ECHO'] = True
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

        user = User.register(username='testuser', password='testing')
        db.session.add(user)
        db.session.commit()

        self.user = user


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
                sess['user'] = self.user.serialize()

            response2 = client.get('/', follow_redirects=True)
            html2 = response2.get_data(as_text=True)

            self.assertEqual(response2.status_code, 200)
            self.assertIn('<h1>Welcome, testuser!</h1>', html2)




