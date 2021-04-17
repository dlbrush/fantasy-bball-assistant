//todo: return object of relevant info by searching through list of players
async function getPlayerInfo(playerId) {
    response = axios.get(`http://data.nba.net/data/10s/prod/v1/2020/players.json`);
}

// Returns an array of player objects for the current season from the JSON data 
async function getAllPlayers() {
    response = await axios.get(`http://data.nba.net/data/10s/prod/v1/${getCurrentSeason()}/players.json`);
    return response.data['league']['standard'];
}

//Returns an array of team objects for the current season from the JSON data
async function getAllTeams() {
    response = await axios.get(`http://data.nba.net/data/1h/prod/${getCurrentSeason()}/teams_config.json`);
    return response.data['teams']['config'];
}

/**
 * getCurrentSeason returns the current season based on the date.
 * Seasons start around September or October and end in May or June.
 * Seasons are identified by the year they start in.
 * So, if it's September or later, return the current year as the season.
 * If it's before September, we're still in the season identified by the previous year.
 */
function getCurrentSeason() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    if (month < 8) {
        return year - 1
    } else {
        return year
    }
}