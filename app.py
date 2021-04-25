from flask import Flask, render_template, redirect, url_for, flash, session, request, jsonify
from flask_debugtoolbar import DebugToolbarExtension
from models import db, connect_db, User, Team, OpponentTeam
from forms import UserForm, TeamBuilderForm, OppTeamBuilderForm
from sqlalchemy.exc import IntegrityError

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "postgresql:///fantasy_bball_assistant"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SQLALCHEMY_ECHO"] = True
app.config["SECRET_KEY"] = "giannis4MVP"
# app.config['DEBUG_TB_INTERCEPT_REDIRECTS'] = False

connect_db(app)

toolbar = DebugToolbarExtension(app)

categories = [('gp', 'GAMES'), ('fgp', 'FG%'), ('ftp', 'FT%'), ('tpg', '3PM'), ('rpg','REB'), ('apg', 'AST'), ('spg', 'STL'), ('bpg', 'BLK'), ('topg', 'TOS'), ('ppg', 'PTS')]
days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

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
                return redirect(url_for('show_user_hub', username=username))
        else: 
            flash('Sorry, that is not your username.')
            return redirect(url_for('show_user_hub', username=session['user']['username']))
    else:
        flash('Please log in first.')
        return redirect(url_for('show_login_form'))
    

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
                return redirect(url_for('show_user_hub', username=username))
        else: 
            flash('Sorry, that is not your username.')
            return redirect(url_for('show_user_hub', username=session['user']['username']))
    else:
        flash('Please log in first.')
        return redirect(url_for('show_login_form'))


@app.route('/<username>/teams/<int:team_id>/projections')
def show_projections(username, team_id):
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
                flash('Sorry, that team does not belong to you.')
                return redirect(url_for('show_user_hub', username=team.owner))
        else: 
            flash('Sorry, that is not your username.')
            return redirect(url_for('show_user_hub', username=session['user']['username']))
    else:
        flash('Please log in first.')
        return redirect(url_for('show_login_form'))

@app.route('/teams/<int:team_id>/opponents/addteam', methods=['GET', 'POST'])
def show_opp_team_builder(team_id):
    team = Team.query.get_or_404(team_id)
    came_from = request.args.get('came_from')
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

                #Redirect player to where they came from, if they came from somewhere
                if came_from:
                    if came_from == 'projections':
                        return redirect(url_for('show_projections', username=team.owner, team_id=team_id))

                return redirect(url_for('show_projections', username=team.owner, team_id=team_id))

            return render_template('opp-team-builder.html', form=form, team=team)
        else:
            flash('Sorry, that team does not belong to you.')
            return redirect(url_for('show_user_hub', username=session['user']['username']))
    else:
        flash('Please log in first.')
        return redirect(url_for('show_login_form'))

@app.route('/teams/<int:team_id>/opponents/<int:opp_team_id>/edit', methods=['GET', 'POST'])
def edit_opp_team(team_id, opp_team_id):
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
                    # TODO: add redirect to where they came from
                    return redirect(url_for('show_opp_team', opp_team_id=opp_team_id, team_id=team.id))

                return render_template('opp-team-edit.html', form=form, opp_team=opp_team, team=team)

            else:
                flash("Sorry, that's an opponent of another team")
                return redirect(url_for('show_team', username=session['user']['username'], team_id=team_id))
        else: 
            flash('Sorry, that is not your team.')
            return redirect(url_for('show_user_hub', username=session['user']['username']))
    else:
        flash('Please log in first.')
        return redirect(url_for('show_login_form'))

@app.route('/teams/<int:team_id>/opponents/<int:opp_team_id>/delete', methods=['POST'])
def delete_opp_team(opp_team_id, team_id):
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
    #Check that user is logged in
    if 'user' in session:
        user = User.query.get(session['user']['username'])
        teams = user.teams
        return render_template('trade-analyzer.html', user=user, teams=teams, cats=categories)
    else:
        flash('Please log in first.')
        return redirect(url_for('show_login_form'))

@app.route('/data/<username>/teams')
def get_user_teams(username):
    user = User.query.get_or_404(username)
    teams = [team.serialize() for team in user.teams]
    return jsonify(teams=teams)

@app.route('/data/teams/<int:team_id>/players')
def get_user_team_players(team_id):
    team = Team.query.get_or_404(team_id)
    players = [player.player_id for player in team.players]
    return jsonify(players=players)

@app.route('/data/oppteams/<int:opp_team_id>')
def get_opp_team_players(opp_team_id):
    opp_team = OpponentTeam.query.get_or_404(opp_team_id)
    name = opp_team.name
    players = [player.player_id for player in opp_team.players]
    return jsonify(name=name, players=players)