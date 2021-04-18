from flask import Flask, render_template, redirect, url_for, flash, session, request
from flask_debugtoolbar import DebugToolbarExtension
from models import db, connect_db, User, Team
from forms import UserForm, TeamBuilderForm
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
    if 'user' in session:
        return redirect(url_for('show_user_hub', username = session['user']['username']))
    return redirect(url_for('show_login_form'))

@app.route('/login', methods=['GET', 'POST'])
def show_login_form():
    form = UserForm()
    if form.validate_on_submit():
        username = form.username.data
        password = form.password.data
        user = User.authenticate(username=username, password=password)
        if user:
            session['user'] = user.serialize()
            return redirect(url_for('show_user_hub', username = username))
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
            session['user'] = user.serialize()
            flash('Welcome to the Fantasy Basketball Assistant! Create your first team here.')
            return redirect(url_for('show_team_builder', username=username))
        except IntegrityError:
            db.session.rollback()
            flash('Username already taken! Please try a different username.')
    return render_template('register.html', form=form)

@app.route('/logout')
def logout_user():
    """
    Remove user details from the session and return to login screen.
    """
    session.pop('user')
    return redirect(url_for('show_login_form'))

@app.route('/<username>')
def show_user_hub(username):
    user = User.query.get_or_404(username)
    if 'user' in session:
        if session['user']['username'] == username:
            # Get the user's teams and render the user hub
            teams = user.teams
            return render_template('user-hub.html', user=user, teams=teams)
        else:
            # Redirect to the user's own hub if they are trying to view someone else's
            return redirect(url_for('show_user_hub', username = session['user']['username']))
    else:
        # Redirect to login if the user is not logged in
        return redirect(url_for('show_login_form'))

@app.route('/<username>/addteam', methods=['GET', 'POST'])
def show_team_builder(username):
    user = User.query.get_or_404(username)
    if 'user' in session:
        if session['user']['username'] == username:
            form = TeamBuilderForm()

            if form.validate_on_submit():
                #Collect form data
                name = form.name.data
                league = form.league.data
                players = request.form.getlist('players')

                #Create a team
                new_team = Team.create(name=name, league=league, owner=username)

                #Add players to team if any were chosen
                if players:
                    new_team.add_players(player_ids=players)

                #Redirect player to the new page for their team!
                return redirect(url_for('show_team', username=username, team_id=new_team.id))
            else:
                return render_template('team-builder.html', user=user, form = form)
        else:
            # Redirect to the user's own hub if they are trying to view someone else's
            return redirect(url_for('show_team_builder', username = session['user']['username']))
    else:
        # Redirect to login if the user is not logged in
        return redirect(url_for('show_login_form'))

@app.route('/<username>/teams/<int:team_id>')
def show_team(username, team_id):
    """
    Show team page.
    This page shows all the players on a team and allows the user to access projections, edit the team, or delete the team.
    """
    user = User.query.get_or_404(username)
    team = Team.query.get_or_404(team_id)
    if 'user' in session:
        if session['user']['username'] == username:
            # Check to make sure this is actually the user's team
            if team in user.teams:
                return render_template('team-view.html', user=user, team=team)
            else:
                flash('Sorry, that team does not belong to you.')
                redirect(url_for('show_user_hub', username=username))

@app.route('/<username>/teams/<int:team_id>/edit', methods=['GET', 'POST'])
def edit_team(username, team_id):
    user = User.query.get_or_404(username)
    team = Team.query.get_or_404(team_id)
    form = TeamBuilderForm(obj=team)
    if 'user' in session:
        if session['user']['username'] == username:
            # Check to make sure this is actually the user's team
            if team in user.teams:
                if form.validate_on_submit():
                    name = form.name.data
                    league = form.league.data
                    players = request.form.getlist('players')
                    team.edit(name=name, league=league, players=players)
                    return redirect(url_for('show_team', username=username, team_id=team.id))
                return render_template('team-edit.html', user=user, team=team, form=form)
            else:
                flash('Sorry, that team does not belong to you.')
                redirect(url_for('show_user_hub', username=username))
        else: 
            flash('Sorry, that is not your username.')
            redirect(url_for('show_user_hub', username=session['user']['username']))
    else:
        flash('Please log in first.')
        redirect(url_for('show_login_form'))
    

@app.route('/<username>/teams/<int:team_id>/delete', methods=['POST'])
def delete_team(username, team_id):
    user = User.query.get_or_404(username)
    team = Team.query.get_or_404(team_id)
    if 'user' in session:
        if session['user']['username'] == username:
            # Check to make sure this is actually the user's team
            if team in user.teams:
                Team.query.filter_by(id=team_id).delete()
                db.session.commit()
                return redirect(url_for('show_user_hub', username=username))
            else:
                flash('Sorry, that team does not belong to you.')
                redirect(url_for('show_user_hub', username=username))
        else: 
            flash('Sorry, that is not your username.')
            redirect(url_for('show_user_hub', username=session['user']['username']))
    else:
        flash('Please log in first.')
        redirect(url_for('show_login_form'))


@app.route('/projections')
def show_projections():
    return False

