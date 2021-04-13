import requests

base_url = 'https://www.balldontlie.io/api/v1/'

def get_all_players() -> list:
    """
    Get JSON of all player data from the API and return it as a list of dictionaries.
    """
    # First, get the first page of 100 players. This will contain metadata that we can use to figure out how many total pages of players we'll need to get.
    response1 = requests.get(f'{base_url}players', {'per_page':100})
    json1 = response1.json()
    
    # Get the number of pages from the JSON
    pages = json1['meta']['total_pages']

    # Get the first list of players from the data.
    players = json1['data']

    # Make a call for every page of players and append each list to our player list.
    for page in range(2, pages + 1):
        response = requests.get(f'{base_url}players', {'per_page':100, 'page': page})
        json = response.json()
        players.extend(json['data'])

    # Return the full list of player dictionaries.
    return players

