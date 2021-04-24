async function getGamesForWeek(player, date) {
    const week = getWeekFromDate(date);
    const weekForSchedule = week.map(day => formatDateForSchedule(day));
    const teamSchedule = await getTeamSchedule(player.teamId);
    return teamSchedule.filter(game => weekForSchedule.find(weekdate => game.homeStartDate === weekdate))
}

async function getNumGamesForWeek(player, date) {
    const games = await getGamesForWeek(player, date);
    return games.length
}

async function populateGameCells(player, date, teamData) {
    const games = await getGamesForWeek(player, date);
    console.log(games);
    const week = getWeekFromDate(date);
    const scheduleWeek = week.map(day => formatDateForSchedule(day));
    scheduleWeek.forEach((scheduleDay, dayNum) => {
        const scheduledGame = games.find(game => game.homeStartDate === scheduleDay);
        if (scheduledGame) {
            const gameCell = document.querySelector(`#player-${player.ID}-day-${dayNum}`);
            const opponent = (scheduledGame.isHomeTeam ? 
                    getTeamData(scheduledGame.vTeam.teamId, teamData).initials :
                    '@' + getTeamData(scheduledGame.hTeam.teamId, teamData).initials 
                );
            gameCell.innerText = opponent;
        }
    })
}

function populateScheduleCells(date) {
    const week = getWeekFromDate(date);
    const cells = document.querySelectorAll('.day');
    cells.forEach(cell => {
        //Get a string of the date for the day of the week matching the index of the cell 
        const date = week[cell.id.substr(-1)].toDateString();
        cell.innerText = date;
    });
}

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
}

function getWeekFromDate(date) {
    const dateDay = shiftDayForMondayStart(date.getDay());
    return [0, 1, 2, 3, 4, 5, 6].map(dayNum => {
        let weekDay = new Date(date);
        weekDay.setDate(date.getDate() + (dayNum - dateDay));
        return weekDay
    })
}

function shiftDayForMondayStart(dayNum) {
    return (dayNum === 0 ? 6 : dayNum - 1);
}

function formatDateForSchedule(date) {
    return `${date.getFullYear()}${getTwoDigitMonth(date)}${getTwoDigitDate(date)}`
}

function getTwoDigitMonth(date) {
    let month = (date.getMonth() + 1).toString();
    if (month.length < 2) {
        month = "0" + month;
    }
    return month
}

function getTwoDigitDate(date) {
    let numDate = date.getDate().toString();
    if (numDate.length < 2) {
        numDate = "0" + date;
    }
    return numDate
}
