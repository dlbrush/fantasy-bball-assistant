from flask import Flask, render_template, redirect, url_for, flash, session, request, jsonify
from flask_debugtoolbar import DebugToolbarExtension
from sqlalchemy.exc import IntegrityError
import os

from models import db, connect_db, User, Team, OpponentTeam
from forms import UserForm, TeamBuilderForm, OppTeamBuilderForm

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'postgresql:///fantasy_bball_assistant')
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SQLALCHEMY_ECHO"] = True
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'giannis4MVP')
app.config['DEBUG_TB_INTERCEPT_REDIRECTS'] = False

connect_db(app)

# toolbar = DebugToolbarExtension(app)

categories = [('gp', 'GAMES'), ('fgp', 'FG%'), ('ftp', 'FT%'), ('tpg', '3PM'), ('rpg','REB'), ('apg', 'AST'), ('spg', 'STL'), ('bpg', 'BLK'), ('topg', 'TOS'), ('ppg', 'PTS')]
days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

@app.route('/')
def show_welcome():
    """
    If the user is logged in already, redirect to their user hub.
    If not, show the welcome page.
    """
    if 'user' in session:
        return redirect(url_for('show_user_hub', username=session['user']['username']))
    return render_template('welcome.html')

@app.route('/login', methods=['GET', 'POST'])
def show_login_form():
    """
    If the user isn't already logged in, show them the login form.
    On successful login, redirect to the user hub.
    """
    if 'user' in session:
        return redirect(url_for('show_user_hub', username=session['user']['username']))
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
    """
    Show the user the form to register a new user.
    On successful submission, take them to the team builder.
    """
    form = UserForm()
    error = None
    if form.validate_on_submit():
        username = form.username.data
        password = form.password.data
        new_user = User.register(username=username, password=password)
        try:
            db.session.add(new_user)
            db.session.commit()
            session['user'] = new_user.serialize()
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
    if 'user' in session:
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
    """
    If user is logged in as the user in the route, show the team builder.
    Otherwise, redirect to their user hub or the login form.
    """
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

                #Update session with current user so we can see the new team in the nav
                session['user'] = user.serialize()

                #Redirect player to the new page for their team!
                return redirect(url_for('show_team', username=username, team_id=new_team.id))
            else:
                return render_template('team-builder.html', user=user, form = form)
        else:
            # Redirect to the user's own team builder if they are logged in as a different user
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
                opponents = team.opponents
                return render_template('team-view.html', user=user, team=team, opponents=opponents)
            else:
                flash('Sorry, that team does not belong to you.')
                return redirect(url_for('show_user_hub', username=username))
        else: 
            flash('Sorry, that is not your username.')
            return redirect(url_for('show_user_hub', username=session['user']['username']))
    else:
        flash('Please log in first.')
        return redirect(url_for('show_login_form'))

@app.route('/<username>/teams/<int:team_id>/edit', methods=['GET', 'POST'])
def edit_team(username, team_id):
    """
    If the user is logged in and the team in the route is one of the user's teams, allow the user to edit their team.
    If not, redirect to their hub or the login screen.
    """
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
                    session['user'] = user.serialize()
                    return redirect(url_for('show_team', username=username, team_id=team.id))
                return render_template('team-edit.html', user=user, team=team, form=form)
            else:
                flash('Sorry, that team does not belong to you.')
                return redirect(url_for('show_user_hub', username=username))
        else: 
            flash('Sorry, that is not your username.')
            return redirect(url_for('show_user_hub', username=session['user']['username']))
    else:
        flash('Please log in first.')
        return redirect(url_for('show_login_form'))
    

@app.route('/<username>/teams/<int:team_id>/delete', methods=['POST'])
def delete_team(username, team_id):
    """
    If the user is logged in and the team in the route belongs to them, delete the team.
    """
    user = User.query.get_or_404(username)
    team = Team.query.get_or_404(team_id)
    if 'user' in session:
        if session['user']['username'] == username:
            # Check to make sure this is actually the user's team
            if team in user.teams:
                Team.query.filter_by(id=team_id).delete()
                db.session.commit()
                session['user'] = user.serialize()
                return redirect(url_for('show_user_hub', username=username))
            else:
                flash('Sorry, that team does not belong to you.')
                return redirect(url_for('show_user_hub', username=username))
        else: 
            flash('Sorry, that is not your username.')
            return redirect(url_for('show_user_hub', username=session['user']['username']))
    else:
        flash('Please log in first.')
        return redirect(url_for('show_login_form'))


@app.route('/<username>/teams/<int:team_id>/projections')
def show_projections(username, team_id):
    """
    If the user is logged in and owns the team in the route, show their weekly projection view.
    """
    user = User.query.get_or_404(username)
    team = Team.query.get_or_404(team_id)
    if 'user' in session:
        if session['user']['username'] == username:
            # Check to make sure this is actually the user's team
            if team in user.teams:
                teams = user.teams
                opponents = team.opponents
                if not team.players:
                    flash('Please edit this team and add players to see projections.')
                return render_template('team-projections.html', user=user, team=team, teams=teams, cats=categories, days=days, opponents=opponents)
            else:
                flash('Sorry, that team does not belong to you.')
                return redirect(url_for('show_user_hub', username=username))
        else: 
            flash('Sorry, that is not your username.')
            return redirect(url_for('show_user_hub', username=session['user']['username']))
    else:
        flash('Please log in first.')
        return redirect(url_for('show_login_form'))

@app.route('/teams/<int:team_id>/opponents/<int:opp_team_id>')
def show_opp_team(opp_team_id, team_id):
    """
    Show opponent team page.
    This page shows all the players on the opposing team and allows the user to edit the team or delete the team.
    """
    opp_team = OpponentTeam.query.get_or_404(opp_team_id)
    team = Team.query.get_or_404(team_id)
    if 'user' in session:
        # Check to make sure this is actually the user's team
        if session['user']['username'] == team.owner:
            #Check to make sure this is actually an opponent of this team
            if opp_team in team.opponents:
                return render_template('opp-team-view.html', team=team, opp_team=opp_team)
            else:
                flash("Sorry, that's an opponent of another team.")
                return redirect(url_for('show_user_hub', username=team.owner))
        else: 
            flash('Sorry, that team does not belong to you.')
            return redirect(url_for('show_user_hub', username=session['user']['username']))
    else:
        flash('Please log in first.')
        return redirect(url_for('show_login_form'))

@app.route('/teams/<int:team_id>/opponents/addteam', methods=['GET', 'POST'])
def show_opp_team_builder(team_id):
    """
    If the user is logged in and the owner of the team of the route, show the opponent team builder form.
    On successful form submission, create the new team and redirect to the opponent team view.
    """
    team = Team.query.get_or_404(team_id)
    if 'user' in session:
        # Check to make sure this is actually the user's team
        if session['user']['username'] == team.owner:
            form = OppTeamBuilderForm()
            if form.validate_on_submit():
                #Collect form data
                name = form.name.data
                players = request.form.getlist('players')

                #Create an opposing team
                new_opp_team = OpponentTeam.create(name=name, plays_against=team_id)

                #Add players to team if any were chosen
                if players:
                    new_opp_team.add_players(player_ids=players)

                #Redirect to view for new team
                return redirect(url_for('show_opp_team', opp_team_id=new_opp_team.id, team_id=team.id))

            return render_template('opp-team-builder.html', form=form, team=team)
        else:
            flash('Sorry, that team does not belong to you.')
            return redirect(url_for('show_user_hub', username=session['user']['username']))
    else:
        flash('Please log in first.')
        return redirect(url_for('show_login_form'))

@app.route('/teams/<int:team_id>/opponents/<int:opp_team_id>/edit', methods=['GET', 'POST'])
def edit_opp_team(team_id, opp_team_id):
    """
    If the user is logged in and the owner of the team in the route, show the opponent team editor form.
    On successful form submission, update the team and redirect to the opponent team view.
    """
    opp_team = OpponentTeam.query.get_or_404(opp_team_id)
    team = Team.query.get_or_404(team_id)
    form = OppTeamBuilderForm(obj=opp_team)
    if 'user' in session:
        # Check to make sure this is actually the user's team
        if session['user']['username'] == team.owner:
            #Check to make sure this is actually an opponent of this team
            if opp_team in team.opponents:

                if form.validate_on_submit():
                    name = form.name.data
                    players = request.form.getlist('players')
                    opp_team.edit(name=name, players=players)
                    
                    return redirect(url_for('show_opp_team', opp_team_id=opp_team_id, team_id=team.id))

                return render_template('opp-team-edit.html', form=form, opp_team=opp_team, team=team)

            else:
                flash("Sorry, that's an opponent of another team.")
                return redirect(url_for('show_team', username=session['user']['username'], team_id=team_id))
        else: 
            flash('Sorry, that is not your team.')
            return redirect(url_for('show_user_hub', username=session['user']['username']))
    else:
        flash('Please log in first.')
        return redirect(url_for('show_login_form'))

@app.route('/teams/<int:team_id>/opponents/<int:opp_team_id>/delete', methods=['POST'])
def delete_opp_team(opp_team_id, team_id):
    """
    If the user is logged in, owns the team in the route, and the opponent team is an opponent of that team, delete the opposing team.
    """
    team = Team.query.get_or_404(team_id)
    opp_team = OpponentTeam.query.get_or_404(opp_team_id)
    if 'user' in session:
        # Check to make sure this is actually the user's team
        if session['user']['username'] == team.owner:
            #Check to make sure this is actually an opponent of this team
            if opp_team in team.opponents:
                OpponentTeam.query.filter_by(id=opp_team_id).delete()
                db.session.commit()
                return redirect(url_for('show_team', username=team.owner, team_id=team.id))
            else:
                flash('Sorry, that team does not belong to you.')
                return redirect(url_for('show_user_hub', username=team.owner))
        else: 
            flash('Sorry, that is not your username.')
            return redirect(url_for('show_user_hub', username=session['user']['username']))
    else:
        flash('Please log in first.')
        return redirect(url_for('show_login_form'))

@app.route('/trade-analyzer')
def show_trade_analyzer():
    """
    If the user is logged in, show the trade analyzer.
    """
    #Check that user is logged in
    if 'user' in session:
        user = User.query.get(session['user']['username'])
        teams = user.teams
        return render_template('trade-analyzer.html', user=user, teams=teams, cats=categories)
    else:
        flash('Please log in first.')
        return redirect(url_for('show_login_form'))

@app.route('/pickup-analyzer')
def show_pickup_analyzer():
    """
    If the user is logged in, show the pickup analyzer.
    """
    #Check that user is logged in
    if 'user' in session:
        user = User.query.get(session['user']['username'])
        teams = user.teams
        return render_template('pickup-analyzer.html', user=user, teams=teams, cats=categories)
    else:
        flash('Please log in first.')
        return redirect(url_for('show_login_form'))

@app.route('/help')
def show_help():
    """
    If the user is logged in, show the help screen
    """
    #Check that user is logged in
    if 'user' in session:
        user = User.query.get(session['user']['username'])
        return render_template('help.html', user=user)
    else:
        flash('Please log in first.')
        return redirect(url_for('show_login_form'))

@app.route('/data/<username>/teams')
def get_user_teams(username):
    """
    Return JSON array of the team ids associated with a user.
    """
    user = User.query.get_or_404(username)
    teams = [team.serialize() for team in user.teams]
    return jsonify(teams=teams)

@app.route('/data/teams/<int:team_id>/players')
def get_user_team_players(team_id):
    """
    Return JSON array of the player ids associated with a team.
    """
    team = Team.query.get_or_404(team_id)
    players = [player.player_id for player in team.players]
    return jsonify(players=players)

@app.route('/data/oppteams/<int:opp_team_id>')
def get_opp_team_players(opp_team_id):
    """
    Return a JSON object containing the name and players associated with an opposing team.
    """
    opp_team = OpponentTeam.query.get_or_404(opp_team_id)
    name = opp_team.name
    players = [player.player_id for player in opp_team.players]
    return jsonify(name=name, players=players)

# Route for running JS tests for API methods
@app.route('/test-api')
def show_api_tests():
    # Only show this route if the user is logged in with the admin account
    if session['user']['username'] == 'admin':
        return render_template('test-api-results.html')
    else:
        flash('You are not authorized to see that page')
        return redirect('root_redirect')