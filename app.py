from flask import Flask, render_template, redirect, url_for, flash
from flask_debugtoolbar import DebugToolbarExtension
from models import db, connect_db, User
from forms import UserForm
from sqlalchemy.exc import IntegrityError

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "postgresql:///fantasy_bball_assistant"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SQLALCHEMY_ECHO"] = True
app.config["SECRET_KEY"] = "giannis4MVP"
# app.config['DEBUG_TB_INTERCEPT_REDIRECTS'] = False

connect_db(app)

toolbar = DebugToolbarExtension(app)

@app.route('/')
def root_redirect():
    """
    If the user is logged in already, redirect to their user hub.
    If not, redirect to the login screen.
    """
    return redirect(url_for('show_login_form'))

@app.route('/login', methods=['GET', 'POST'])
def show_login_form():
    form = UserForm()
    if form.validate_on_submit():
        username = form.username.data
        password = form.password.data
        user = User.authenticate(username=username, password=password)
        if user:
            return 'Logged in!'
        else:
            flash('Invalid username or password.')
    return render_template('login.html', form=form)

@app.route('/register', methods=['GET', 'POST'])
def show_registration_form():
    form = UserForm()
    error = None
    if form.validate_on_submit():
        username = form.username.data
        password = form.password.data
        new_user = User.register(username=username, password=password)
        try:
            db.session.add(new_user)
            db.session.commit()
        except IntegrityError:
            flash('Username already taken! Please enter a different username.')
    return render_template('register.html', form=form)