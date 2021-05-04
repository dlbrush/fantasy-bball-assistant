//Some global variables to use for document elements
const scheduleBody = document.querySelector('#user-player-grid-schedule-body');

//Rewriting functions to use mock data for testing
function getGamesForWeek(player, date) {
    const week = getWeekFromDate(date);
    const weekForSchedule = week.map(day => formatDateForSchedule(day));
    const teamSchedule = testSchedule;
    return teamSchedule.filter(game => weekForSchedule.find(weekdate => game.homeStartDate === weekdate))
}

function getNumGamesForWeek(player, date) {
    const games = getGamesForWeek(player, date);
    return games.length
}

function getNumWeekGamesRemaining(player, date) {
    const games = getGamesForWeek(player, date);
    const week = getWeekFromDate(date);
    const remainingWeek = week.filter(day => day > date)
    const remainingWeekForSchedule = remainingWeek.map(day => formatDateForSchedule(day))
    const remainingGames = games.filter(game => remainingWeekForSchedule.find(weekdate => game.homeStartDate === weekdate));
    return remainingGames.length
}

function populateGameCells(player, date, teamData, table) {
    const games = getGamesForWeek(player, date);
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

describe('getGamesForWeek returns an array of game info for the games the player will play during the week of the date passed', function() {
    it('Returns 4 game objects from the test data for the week of 4/26/2021', function() {
        const date = new Date(2021, 3, 26);
        const games = getGamesForWeek(testPlayer, date);
        expect(games.length).toEqual(4);
        expect(typeof(games[0])).toEqual('object');
    });
});

describe('getNumGamesForWeek gets the games the player will play in a week and returns just the number', function() {
    it('Returns 4 when getting the number of games in the test data for the week of 4/26/2021', function() {
        const date = new Date(2021, 3, 26);
        expect(getNumGamesForWeek(testPlayer, date)).toEqual(4);
    });
});

describe('getNumWeekGamesRemaining gets the number of games the passed player will play in the week of the date passed that occur after that date', function() {
    it('Returns 2 games remaining for the player in the test schedule in the week of 4/29/2021', function() {
        const date = new Date(2021, 3, 29);
        expect(getNumWeekGamesRemaining(testPlayer, date)).toEqual(2);
    });

    it('Returns 0 games remaining for the player in the test schedule in the week of 5/9/2021', function() {
        const date = new Date(2021, 4, 9);
        expect(getNumWeekGamesRemaining(testPlayer, date)).toEqual(0);
    });
});


describe('populateGameCells fills the schedule grid with the initials of the teams the player will play on those days', function() {
    it('Fills in team initials without an @ for home games', function() {
        const date = new Date(2021, 3, 26);
        const row = createPlayerScheduleRow(scheduleBody, testPlayer, date);
        populateGameCells(testPlayer, date, testTeamData, scheduleBody);
        const fridayCell = row.querySelector('#player-2544-day-4');
        expect(fridayCell.innerText).toEqual('SAC');
    });

    it('Fills in team initials with an @ for away games', function() {
        const date = new Date(2021, 3, 26);
        const row = createPlayerScheduleRow(scheduleBody, testPlayer, date);
        populateGameCells(testPlayer, date, testTeamData, scheduleBody);
        const mondayCell = row.querySelector('#player-2544-day-0');
        expect(mondayCell.innerText).toEqual('@ORL');
    });

    it('Leaves hyphen on dates where the player does not play', function() {
        const date = new Date(2021, 3, 26);
        const row = createPlayerScheduleRow(scheduleBody, testPlayer, date);
        populateGameCells(testPlayer, date, testTeamData, scheduleBody);
        const tuesdayCell = row.querySelector('#player-2544-day-1');
        expect(tuesdayCell.innerText).toEqual('-');
    });

    afterEach(function() {
        clearChildren(scheduleBody);
    });
});

describe('populateScheduleCells fills the table header cells of a schedule grid with the dates for the week of the passed date', function() {
    it('Maps date strings to all 7 weekdays', function() {
        const date = new Date(2021, 3, 26);
        const week = getWeekFromDate(date);
        const cells = populateScheduleCells(date);
        expect(cells.length).toEqual(7);
        for (let i = 0; i < cells.length; i++) {
            expect(week[i].toDateString()).toEqual(cells[i].innerText);
        }
    });
});

describe('createPlayerScheduleRow creates a row of cells for a player for each weekday to be filled if the player plays on that day', function() {
    it('Returns a row with the player ID', function() {
        const date = new Date();
        const row = createPlayerScheduleRow(scheduleBody, testPlayer, date);
        expect(row.tagName).toEqual('TR');
        expect(row.id).toEqual('player-2544-schedule');
        clearChildren(scheduleBody);
    });

    it('Starts with a header element for player info', function() {
        const date = new Date();
        const row = createPlayerScheduleRow(scheduleBody, testPlayer, date);
        const head = row.firstChild;
        expect(head.tagName).toEqual('TH');
        expect(head.classList.contains('player-2544-head')).toEqual(true);
    });

    it('Populates player-day cells for each day of the week', function() {
        const date = new Date()
        const row = createPlayerScheduleRow(scheduleBody, testPlayer, date);
        const days = row.querySelectorAll('.player-day');
        expect(days.length).toEqual(7);
    });

    it('Ends with a total games cell', function() {
        const date = new Date()
        const row = createPlayerScheduleRow(scheduleBody, testPlayer, date);
        const totalGames = row.lastChild;
        expect(totalGames.classList).toContain('cat-2544-total');
    });

    afterEach(function() {
        clearChildren(scheduleBody);
    });
});

describe('getWeekFromDate creates an array of 7 Date objects based on the passed date, starting with the most recent Monday', function() {
    it('Returns an array of 7 date objects', function() {
        const today = new Date();
        const week = getWeekFromDate(today);
        expect(week.length).toEqual(7);
        expect(week[0] instanceof Date).toEqual(true);
    });

    it('Starts the week on a Monday', function() {
        const today = new Date();
        const week = getWeekFromDate(today);
        expect(week[0].getDay()).toEqual(1);
    });
});

describe('shiftDayForMondayStart returns 6 when the day is Sunday, and the day index - 1 otherwise', function() {
    it('Returns 6 when the number passed is 0', function() {
        expect(shiftDayForMondayStart(0)).toEqual(6);
    });

    it('Returns the number - 1 when the number passed is not 0', function() {
        expect(shiftDayForMondayStart(1)).toEqual(0);
        expect(shiftDayForMondayStart(5)).toEqual(4);
    });
});

describe('formatDateForSchedule returns the date passed as a string matching the NBA schedule format', function() {
    it('Returns April 6 2021 as 20210406', function() {
        const date = new Date(2021, 3, 6);
        expect(formatDateForSchedule(date)).toEqual('20210406');
    });

    it('Returns October 18 2021 as 20211018', function() {
        const date = new Date(2021, 9, 18);
        expect(formatDateForSchedule(date)).toEqual('20211018');
    });
});

describe('getTwoDigitMonth adds one to the indexed month number to match calendar month numbers, and adds a leading zero to single-digit months', function() {
    it('Returns 04 for a date in April', function() {
        const date = new Date(2021, 3, 6);
        expect(getTwoDigitMonth(date)).toEqual('04');
    });

    it('Returns 11 for a date in November', function() {
        const date = new Date(2021, 10, 6);
        expect(getTwoDigitMonth(date)).toEqual('11');
    });
});

describe('getTwoDigitDate returns the date as a 2-digit string, starting with a leading 0 for single-digit dates', function() {
    it('Returns 01 for the 1st of a month', function() {
        const date = new Date(2022, 1, 1);
        expect(getTwoDigitDate(date)).toEqual('01');
    })

    it('Returns 31 for the 31st of a month', function() {
        const date = new Date(2021, 11, 31);
        expect(getTwoDigitDate(date)).toEqual('31');
    })
})