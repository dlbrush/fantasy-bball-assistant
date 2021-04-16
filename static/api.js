//todo: return object of relevant info by searching through list of players
async function getPlayerInfo(playerId) {
    response = axios.get(`http://data.nba.net/data/10s/prod/v1/2020/players.json`);
}