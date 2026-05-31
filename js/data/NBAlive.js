// ============================================================
// NBAlive.js
// NBA Playoffs 2026 = live data from balldontlie.io
// Round detection based on series wins, not dates
// ============================================================

const API_KEY = "c2c68599-643d-4291-992f-60fa5ed143f5";
const BASE_URL = "https://api.balldontlie.io/v1";

async function bdlFetch(path) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: API_KEY }
  });
  if (!response.ok) throw new Error(`API error ${response.status}`);
  return response.json();
}

// ============================================================
// FETCH LIVE NBA PLAYOFF GAMES
// ============================================================
async function fetchNBAPlayoffGames() {
  const data = await bdlFetch(
    `/games?start_date=2026-04-18&end_date=2026-06-30&per_page=100`
  );
  return data.data.filter(g => g.postseason === true);
}

// ============================================================
// FIGURE OUT WHICH ROUND EACH GAME BELONGS TO
//
// Strategy: group games by team pair to find series.
// Count wins in each series. A team that has won N series
// is in round N+1. This works regardless of which conference
// moves faster.
//
// Round mapping:
//   0 series wins = First Round
//   1 series win  = Conference Semifinals
//   2 series wins = Conference Finals
//   3 series wins = NBA Finals
// ============================================================
function assignRounds(games) {
  const ROUND_NAMES = [
    "First Round",
    "Conference Semifinals",
    "Conference Finals",
    "NBA Finals"
  ];

  // Step 1: group games by unique team pair (sorted so order doesn't matter)
  const seriesMap = new Map();
  games.forEach(g => {
    const key = [g.home_team.abbreviation, g.visitor_team.abbreviation].sort().join('|');
    if (!seriesMap.has(key)) seriesMap.set(key, []);
    seriesMap.get(key).push(g);
  });

  // Step 2: for each series, figure out who won (4 wins = series winner)
  // Track how many series each team has won so far
  const seriesWins = {}; // teamAbbr → number of series won

  // Sort series by their earliest game date so we process rounds in order
  const seriesList = Array.from(seriesMap.entries()).sort((a, b) => {
    const dateA = a[1][0].date;
    const dateB = b[1][0].date;
    return dateA < dateB ? -1 : 1;
  });

  // Step 3: assign round to each series based on the lower of the two
  // teams' series win counts at the time that series started
  const seriesRound = new Map(); // seriesKey → round name

  seriesList.forEach(([key, seriesGames]) => {
    const [teamA, teamB] = key.split('|');
    const winsA = seriesWins[teamA] || 0;
    const winsB = seriesWins[teamB] || 0;

    // The round is determined by how many series each team has already won
    // Both teams should have the same count (they both won to get here)
    // Use the minimum just in case of any data oddity
    const roundIndex = Math.min(winsA, winsB);
    const roundName = ROUND_NAMES[roundIndex] || "NBA Finals";
    seriesRound.set(key, roundName);

    // Count wins in this series to update seriesWins
    const wins = {};
    seriesGames.forEach(g => {
      if (g.status !== "Final") return;
      const winner = g.home_team_score > g.visitor_team_score
        ? g.home_team.abbreviation
        : g.visitor_team.abbreviation;
      wins[winner] = (wins[winner] || 0) + 1;
    });

    // If someone has 4 wins, they won the series — increment their count
    [teamA, teamB].forEach(team => {
      if ((wins[team] || 0) >= 4) {
        seriesWins[team] = (seriesWins[team] || 0) + 1;
      }
    });
  });

  // Step 4: return a lookup map of gameId → round name
  const gameRounds = new Map();
  seriesList.forEach(([key, seriesGames]) => {
    const roundName = seriesRound.get(key);
    seriesGames.forEach(g => gameRounds.set(g.id, roundName));
  });

  return gameRounds;
}

// ============================================================
// CONVERT: API game object → your app's Match format
// ============================================================
function apiGameToMatch(game, roundName) {
  let status = "upcoming";
  if (game.status === "Final") {
    status = "completed";
  } else if (game.period > 0 && game.time && game.time !== "") {
    status = "live";
  }

  const homeId = game.home_team.abbreviation.toLowerCase();
  const awayId = game.visitor_team.abbreviation.toLowerCase();

  return {
    id: `api-${game.id}`,
    homeTeam: homeId,
    awayTeam: awayId,
    dateTime: game.date,
    venue: null,
    homeScore: game.home_team_score || null,
    awayScore: game.visitor_team_score || null,
    round: roundName,
    status: status
  };
}

// ============================================================
// BUILD LIVE NBA PLAYOFFS 2026 COMPETITION OBJECT
// ============================================================
async function buildNBAPlayoffs2026() {
  try {
    const games = await fetchNBAPlayoffGames();

    // Assign correct round to every game
    const gameRounds = assignRounds(games);

    // Build teams list
    const teamsMap = new Map();
    games.forEach(game => {
      const homeId = game.home_team.abbreviation.toLowerCase();
      const awayId = game.visitor_team.abbreviation.toLowerCase();
      if (!teamsMap.has(homeId)) {
        teamsMap.set(homeId, { id: homeId, name: game.home_team.full_name });
      }
      if (!teamsMap.has(awayId)) {
        teamsMap.set(awayId, { id: awayId, name: game.visitor_team.full_name });
      }
    });

    const teams = Array.from(teamsMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    const matches = games.map(g => apiGameToMatch(g, gameRounds.get(g.id) || "Playoffs"));

    return {
      id: "nba-2026-playoffs",
      name: "NBA Playoffs 2026",
      sport: "basketball",
      category: "NBA",
      status: "ongoing",
      dateStart: "2026-04-18",
      dateEnd: "2026-06-19",
      description: "The 2026 NBA Playoffs. San Antonio Spurs vs New York Knicks in the NBA Finals starting June 3.",
      watchLink: null,
      teams: teams,
      matches: matches,
      bracket: null
    };

  } catch (error) {
    console.error("Failed to fetch live NBA playoff data:", error);
    return null;
  }
}

// ============================================================
// MAIN: getBasketballData()
// ============================================================
async function getBasketballData() {
  const livePlayoffs = await buildNBAPlayoffs2026();

  const regularSeason = BASKETBALL_DATA.find(c => c.id === "nba-2025-regular");
  const restOfMock = BASKETBALL_DATA.filter(c => c.id !== "nba-2025-regular");

  const combined = [];
  if (livePlayoffs) combined.push(livePlayoffs);
  if (regularSeason) combined.push(regularSeason);
  combined.push(...restOfMock);

  return combined;
}

window.getBasketballData = getBasketballData;