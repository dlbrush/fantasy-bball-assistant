# import requests
# from utility import get_current_season

# base_url = 'http://data.nba.net/data/10s/prod/v1/'

# def get_season_players(season) -> list:
#     """
#     Get JSON of all player data from the API and return it as a list of dictionaries.
#     """
#     # First, get the first page of 100 players. This will contain metadata that we can use to figure out how many total pages of players we'll need to get.
#     response = requests.get(f'{base_url}{season}/players.json')
#     json = response.json()

#     # Return the list of player dictionaries in the standard league (the NBA)
#     return json['league']['standard']

# def get_current_season_players():
#     return get_season_players(get_current_season())

# CURRENTLY NOT NEEDED