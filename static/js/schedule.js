/**
 * Returns game info for all games the passed player will play in the week of the date passed
 * @param {Object} player Player info object from getPlayers
 * @param {Date} date 
 * @returns {Promise} On successful promise, returns array of game info objects
 */
async function getGamesForWeek(player, date) {
    const week = getWeekFromDate(date);
    const weekForSchedule = week.map(day => formatDateForSchedule(day));
    const teamSchedule = await getTeamSchedule(player.teamId);
    return teamSchedule.filter(game => weekForSchedule.find(weekdate => game.homeStartDate === weekdate))
}

/**
 * Gets the games the player will play in a week and returns just the number
 * @param {Object} player Player info object from getPlayers
 * @param {Date} date 
 * @returns {Promise} On successful promise, returns number of games in scheduled week
 */
async function getNumGamesForWeek(player, date) {
    const games = await getGamesForWeek(player, date);
    return games.length
}

/**
 * Gets the number of games the passed player will play in the week of the date passed that occur after that date
 * @param {Object} player Player info object from getPlayers
 * @param {Date} date 
 * @returns {Promise} On successful promise, returns number of games remaining in the week of the past date after the passed date
 */
async function getNumWeekGamesRemaining(player, date) {
    const games = await getGamesForWeek(player, date);
    const week = getWeekFromDate(date);
    const remainingWeek = week.filter(day => day > date)
    const remainingWeekForSchedule = remainingWeek.map(day => formatDateForSchedule(day))
    const remainingGames = games.filter(game => remainingWeekForSchedule.find(weekdate => game.homeStartDate === weekdate));
    return remainingGames.length
}

/**
 * Fills the schedule grid with the initials of the teams the player will play on those days
 * @param {Object} player Player info object from getPlayers
 * @param {Date} date 
 * @param {Array} teamData Team data array from the API
 * @param {HTMLElement} table The table being populated with game cells
 */
async function populateGameCells(player, date, teamData, table) {
    const games = await getGamesForWeek(player, date);
    const week = getWeekFromDate(date);
    const scheduleWeek = week.map(day => formatDateForSchedule(day));
    scheduleWeek.forEach((scheduleDay, dayNum) => {
        const scheduledGame = games.find(game => game.homeStartDate === scheduleDay);
        if (scheduledGame) {
            const gameCell = table.querySelector(`#player-${player.ID}-day-${dayNum}`);
            const opponent = (scheduledGame.isHomeTeam ? 
                    getTeamData(scheduledGame.vTeam.teamId, teamData).initials :
                    '@' + getTeamData(scheduledGame.hTeam.teamId, teamData).initials 
                );
            gameCell.innerText = opponent;
        }
    })
}

/**
 * Fills the table header cells of a schedule grid with the dates for the week of the passed date
 * @param {Date} date 
 * @returns {NodeList} List of cells captured by the querySelectorAll call in the function
 */
function populateScheduleCells(date) {
    const week = getWeekFromDate(date);
    const cells = document.querySelectorAll('.day');
    cells.forEach(cell => {
        //Get a string of the date for the day of the week matching the index of the cell 
        const date = week[cell.id.substr(-1)].toDateString();
        cell.innerText = date;
    });
    return cells;
}

/**
 * Creates a row of cells for a player for each weekday to be filled if the player plays on that day
 * @param {HTMLElement} table The tbody element of the schedule grid
 * @param {Object} player Player info object from getPlayers 
 * @param {Date} date 
 * @returns {HTMLElement} Table row created for the player
 */
function createPlayerScheduleRow(table, player, date) {
    const week = getWeekFromDate(date);

    const row = document.createElement('tr');
    row.id = `player-${player.ID}-schedule`;
    
    const head = document.createElement('th');
    head.classList.add('player-row-head', `player-${player.ID}-head`);
    row.append(head);

    for (let day of week) {
        const cell = document.createElement('td');
        cell.classList.add('player-day', 'text-center');
        cell.id = `player-${player.ID}-day-${week.indexOf(day)}`;
        cell.innerText = '-';
        row.append(cell);
    }

    const totalGames = document.createElement('td');
    totalGames.classList.add(`cat-${player.ID}-total`, 'text-center');
    totalGames.id = `${player.ID}-gp-total`;
    row.append(totalGames);

    table.append(row);

    return row
}

/**
 * Based on the date passed, creates an array of 7 days starting on the most recent Monday
 * @param {Date} date 
 * @returns {Array} Array of 7 date objects
 */
function getWeekFromDate(date) {
    const dateDay = shiftDayForMondayStart(date.getUTCDay());
    return [0, 1, 2, 3, 4, 5, 6].map(dayNum => {
        let weekDay = new Date(date);
        weekDay.setDate(date.getUTCDate() + (dayNum - dateDay));
        return weekDay
    })
}

/**
 * If the day index is 0 (Sunday), return 6, the last day of the week. Otherwise, return the index - 1.
 * @param {Number} dayNum 
 * @returns {Number}
 */
function shiftDayForMondayStart(dayNum) {
    return (dayNum === 0 ? 6 : dayNum - 1);
}


/**
 * @param {Date} date 
 * @returns {String} The date as a string formatted as YYYYMMDD
 */
function formatDateForSchedule(date) {
    return `${date.getFullYear()}${getTwoDigitMonth(date)}${getTwoDigitDate(date)}`
}

/**
 * @param {Date} date 
 * @returns {String} The month for the passed date, as a 2-digit string with a leading 0 for single-digit months
 */
function getTwoDigitMonth(date) {
    let month = (date.getMonth() + 1).toString();
    if (month.length < 2) {
        month = "0" + month;
    }
    return month
}

/**
 * @param {Date} date 
 * @returns The date as a 2-digit string, starting with a leading 0 for single-digit dates
 */
function getTwoDigitDate(date) {
    let numDate = date.getDate().toString();
    if (numDate.length < 2) {
        numDate = "0" + numDate;
    }
    return numDate
}
