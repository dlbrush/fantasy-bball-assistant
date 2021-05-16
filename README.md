# Fantasy Basketball Assistant
## Summary
This Fantasy Basketball Assistant is designed to help NBA fantasy basketball managers make decisions about their teams. The app pulls game schedule and statistical data from the NBA Data API and makes basic projections of the total production of a set of players for a given week. It also compares stats between players to help managers plan trades and pickups.

This app is designed to be used by players in Head to Head 9-category leagues. Support for Rotisserie or Points leagues is not in development at the moment.

### Production Link
The production version of this app is deployed at [https://fantasy-bball-assistant.herokuapp.com/](https://fantasy-bball-assistant.herokuapp.com/)

### Tech Stack
- Server-side code written in **Python 3.7** using **Flask** backend framework
- **PostgreSQL** database with **Flask-SQLAlchemy**
- **Bootstrap 4.6** for basic front-end layout
- **JQuery** is required for some Bootstrap features, but all other front-end code is written in **Vanilla JavaScript** with **Axios** for HTTP requests.

## Getting Started

### Installation and running locally
1. If you have not already, install Python and PostgreSQL on your machine.
2. Clone this repo onto your local machine.
3. From the command line, in your local directory for this repo, run `$ python -m venv venv`, which should create a virtual environment folder in your directory. Activate this environment by running `$ source venv/bin/activate`.
4. Install all of the required packages by running `$ pip install -r requirements.txt`
5. Create a local version of the database in PostgreSQL.
    - To match the source code without further configuration, from the command line run `createdb fantasy_bball_assistant`. If you will be running the Python unit tests, make sure to also run `createdb fba_test`.
    - If you'd like to use your own database names, make sure to change the default value of `app.config['SQLALCHEMY_DATABASE_URI']` in the following locations:
        - `app.py` on line 20
        - `test_app.py` and `test_models.py` on line 9
6. (Optional) If you'd like to start with a test user and team in the database, from the command line run `$ python run seed.py`. This will create a test user with a username of **testuser** and a password of **testing**.
7. To start the server, run `flask run` from the command line. Open your local host IP in the browser to run your local copy of the app.

### Standard User Flow

1. Register for an account. All features of the site require the user to be logged into an account.
2. Create a team. The intention is for the players on your team in this app to match the one you're playing in a real fantasy league with. The tools on this site assist you in managing a real team in a real league by making projections based on the players you have - this app does not host or simulate a fantasy league.
3. From your team's page (accessible from the bar at the top of the screen or from your home page), click "Get Projections" to see your team's total statistical projections for the current week. Choose another date to project for a different week.
4. If you'd like to compare your team against another team, create an opposing team from your team's page or from the team projection page. Once an opposing team is created, you can select that team from the menu on the projection page to compare their stats to your team.
5. Use the Trade Analyzer to compare per-game statstics in all Fantasy Basketball categories between two sets of players. Use this to analyze the potential impact of trading your players for players on another team.
6. Use the Pickup Analyzer to see the potential impact of dropping a player from your team, adding a player to your team, or both. This tool will show per-game stats for the players as well as your team's total stats for the rest of the current week, so that you can assess the impact of picking up a player on the current week of competition.
7. Return to this app throughout the fantasy basketball season in order to get projections against different teams and assess the impact of a pickup or drop on any day/week you'd like. Edit your team and add/edit opponent teams to keep your lineup for matchup projections up-to-date.


## Key Features
### Team Projections

## Testing


### API Information
I am using the NBA Data API for player stats and NBA schedule data. Documentation on how to use this API can be found [here](https://github.com/kashav/nba.js/blob/master/docs/api/DATA.md).