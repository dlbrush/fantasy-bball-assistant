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