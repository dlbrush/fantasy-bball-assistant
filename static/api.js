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
    response = await axios.get(`http://data.nba.net/data/10s/prod/v1/current/standings_all.json`);
    return response.data['league']['standard']['teams'];
}

//Returns an array of game objects for every game the given team will play in the current season
async function getTeamSchedule(teamCode) {
    response = await axios.get(`http://data.nba.net/data/10s/prod/v1/${getCurrentSeason()}/teams/${teamCode}/schedule.json`);
    return response.data['league']['standard']
}

//Returns an object of per-game average stats for the current year
async function getPlayerPerGame(teamId) {
    response = await axios.get(`http://data.nba.net/data/10s/prod/v1/${getCurrentSeason()}/players/${teamId}_profile.json`);
    return response.data['league']['standard']['stats']['latest']
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