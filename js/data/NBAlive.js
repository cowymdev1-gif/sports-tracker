// ============================================================
// basketball.js
// NBA Regular Season = live data from balldontlie.io API
// Everything else = kept as-is (WNBA, Olympics, FIBA, NCAA)
// ============================================================

const API_KEY = "c2c68599-643d-4291-992f-60fa5ed143f5"; // ← paste your rotated key here

const BASE_URL = "https://api.balldontlie.io/v1";

// ============================================================
// HELPER: fetch from the API with your key attached
// ============================================================
async function bdlFetch(path) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: API_KEY }
  });
  if (!response.ok) throw new Error(`API error ${response.status}`);
  return response.json();
}

// ============================================================
// HELPER: build a "YYYY-MM-DD" string from a Date object
// ============================================================
function toDateStr(date) {
  return date.toISOString().split("T")[0];
}

// ============================================================
// FETCH LIVE NBA GAMES
// Gets games from 14 days ago through 7 days ahead
// ============================================================
async function fetchNBAGames() {
  const start = new Date();
  start.setDate(start.getDate() - 14);

  const end = new Date();
  end.setDate(end.getDate() + 7);

  const data = await bdlFetch(
    `/games?start_date=${toDateStr(start)}&end_date=${toDateStr(end)}&per_page=100`
  );

  return data.data; // array of raw game objects from the API
}

// ============================================================
// CONVERT: API game object → your app's Match format
// ============================================================
function apiGameToMatch(game, index) {
  // Work out the status
  let status = "upcoming";
  if (game.status === "Final") {
    status = "completed";
  } else if (game.period > 0 && game.time && game.time !== "") {
    status = "live";
  }

  // Use team abbreviation as ID so it's short and unique
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
    round: "Regular Season",
    status: status
  };
}

// ============================================================
// BUILD LIVE NBA COMPETITION OBJECT
// Matches the exact shape your app expects
// ============================================================
async function buildNBARegularSeason() {
  try {
    const games = await fetchNBAGames();

    // Build teams list from whatever teams appear in the fetched games
    // Using a Map to avoid duplicates
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

    const matches = games.map(apiGameToMatch);

    return {
      id: "nba-2025-regular",
      name: "NBA Regular Season 2025–26",
      sport: "basketball",
      category: "NBA",
      status: "ongoing",
      dateStart: "2025-10-22",
      dateEnd: "2026-04-13",
      description:
        "The 79th NBA season featuring all 30 teams competing across the Eastern and Western Conferences for playoff seeding.",
      watchLink: null,
      teams: teams,
      matches: matches,
      bracket: null
    };
  } catch (error) {
    console.error("Failed to fetch live NBA data:", error);

    // If the API fails, fall back to the original mock data so app doesn't break
    return {
      id: "nba-2025-regular",
      name: "NBA Regular Season 2025–26",
      sport: "basketball",
      category: "NBA",
      status: "ongoing",
      dateStart: "2025-10-22",
      dateEnd: "2026-04-13",
      description:
        "The 79th NBA season featuring all 30 teams competing across the Eastern and Western Conferences for playoff seeding.",
      watchLink: null,
      teams: [
        { id: "celtics", name: "Boston Celtics", seed: 1 },
        { id: "lakers", name: "LA Lakers", seed: 3 },
        { id: "warriors", name: "Golden State Warriors", seed: 5 },
        { id: "knicks", name: "New York Knicks", seed: 2 },
        { id: "nuggets", name: "Denver Nuggets", seed: 1 },
        { id: "heat", name: "Miami Heat", seed: 6 }
      ],
      matches: [
        { id: "m1", homeTeam: "celtics", awayTeam: "knicks", dateTime: "2025-10-22T19:30", venue: "TD Garden, Boston", homeScore: 114, awayScore: 108, round: "Regular Season", status: "completed" },
        { id: "m2", homeTeam: "lakers", awayTeam: "warriors", dateTime: "2025-10-22T22:00", venue: "Crypto.com Arena, Los Angeles", homeScore: 121, awayScore: 117, round: "Regular Season", status: "completed" },
        { id: "m3", homeTeam: "nuggets", awayTeam: "heat", dateTime: "2025-10-23T21:00", venue: "Ball Arena, Denver", homeScore: 109, awayScore: 103, round: "Regular Season", status: "completed" },
        { id: "m4", homeTeam: "knicks", awayTeam: "lakers", dateTime: "2025-12-25T12:00", venue: "Madison Square Garden, New York", homeScore: 118, awayScore: 112, round: "Regular Season", status: "completed" },
        { id: "m5", homeTeam: "celtics", awayTeam: "nuggets", dateTime: "2026-01-15T19:30", venue: "TD Garden, Boston", homeScore: null, awayScore: null, round: "Regular Season", status: "upcoming" },
        { id: "m6", homeTeam: "warriors", awayTeam: "heat", dateTime: "2026-01-18T22:00", venue: "Chase Center, San Francisco", homeScore: null, awayScore: null, round: "Regular Season", status: "upcoming" }
      ],
      bracket: null,
      error: error.message
    };
  }
}

// ============================================================
// NON-NBA DATA (kept exactly as your original mock data)
// ============================================================
const STATIC_BASKETBALL_DATA = [
  {
    id: "nba-2025-playoffs",
    name: "NBA Playoffs 2025",
    sport: "basketball",
    category: "NBA",
    status: "completed",
    dateStart: "2025-04-19",
    dateEnd: "2025-06-22",
    description: "The 2025 NBA Playoffs featuring the top 8 teams from each conference battling through four rounds to reach the Finals.",
    watchLink: null,
    teams: [
      { id: "celtics", name: "Boston Celtics", seed: 1 },
      { id: "knicks", name: "New York Knicks", seed: 2 },
      { id: "bucks", name: "Milwaukee Bucks", seed: 3 },
      { id: "heat", name: "Miami Heat", seed: 4 },
      { id: "nuggets", name: "Denver Nuggets", seed: 1 },
      { id: "thunder", name: "Oklahoma City Thunder", seed: 2 },
      { id: "lakers", name: "LA Lakers", seed: 3 },
      { id: "warriors", name: "Golden State Warriors", seed: 4 }
    ],
    matches: [
      { id: "p1", homeTeam: "celtics", awayTeam: "heat", dateTime: "2025-04-19T13:00", venue: "TD Garden, Boston", homeScore: 120, awayScore: 101, round: "First Round", status: "completed" },
      { id: "p2", homeTeam: "knicks", awayTeam: "bucks", dateTime: "2025-04-20T13:00", venue: "Madison Square Garden, New York", homeScore: 108, awayScore: 104, round: "First Round", status: "completed" },
      { id: "p3", homeTeam: "nuggets", awayTeam: "warriors", dateTime: "2025-04-19T22:00", venue: "Ball Arena, Denver", homeScore: 114, awayScore: 99, round: "First Round", status: "completed" },
      { id: "p4", homeTeam: "thunder", awayTeam: "lakers", dateTime: "2025-04-20T22:00", venue: "Paycom Center, Oklahoma City", homeScore: 118, awayScore: 111, round: "First Round", status: "completed" },
      { id: "p5", homeTeam: "celtics", awayTeam: "knicks", dateTime: "2025-05-05T13:00", venue: "TD Garden, Boston", homeScore: 112, awayScore: 106, round: "Conference Semifinals", status: "completed" },
      { id: "p6", homeTeam: "nuggets", awayTeam: "thunder", dateTime: "2025-05-06T21:00", venue: "Ball Arena, Denver", homeScore: 107, awayScore: 110, round: "Conference Semifinals", status: "completed" },
      { id: "p7", homeTeam: "celtics", awayTeam: "thunder", dateTime: "2025-05-20T19:30", venue: "TD Garden, Boston", homeScore: 115, awayScore: 108, round: "Conference Finals", status: "completed" },
      { id: "p8", homeTeam: "thunder", awayTeam: "celtics", dateTime: "2025-06-22T20:00", venue: "Paycom Center, Oklahoma City", homeScore: 98, awayScore: 104, round: "NBA Finals", status: "completed" }
    ],
    bracket: [
      { name: "First Round", matches: ["p1","p2","p3","p4"] },
      { name: "Conference Semifinals", matches: ["p5","p6"] },
      { name: "Conference Finals", matches: ["p7"] },
      { name: "NBA Finals", matches: ["p8"] }
    ]
  },
  {
    id: "nba-2025-finals",
    name: "NBA Finals 2025",
    sport: "basketball",
    category: "NBA",
    status: "completed",
    dateStart: "2025-06-05",
    dateEnd: "2025-06-22",
    description: "The Boston Celtics faced the Oklahoma City Thunder in the 2025 NBA Finals. Boston claimed the championship in 6 games.",
    watchLink: null,
    teams: [
      { id: "celtics", name: "Boston Celtics", seed: 1 },
      { id: "thunder", name: "Oklahoma City Thunder", seed: 2 }
    ],
    matches: [
      { id: "f1", homeTeam: "celtics", awayTeam: "thunder", dateTime: "2025-06-05T21:00", venue: "TD Garden, Boston", homeScore: 107, awayScore: 89, round: "NBA Finals - Game 1", status: "completed" },
      { id: "f2", homeTeam: "celtics", awayTeam: "thunder", dateTime: "2025-06-08T21:00", venue: "TD Garden, Boston", homeScore: 99, awayScore: 106, round: "NBA Finals - Game 2", status: "completed" },
      { id: "f3", homeTeam: "thunder", awayTeam: "celtics", dateTime: "2025-06-11T21:00", venue: "Paycom Center, Oklahoma City", homeScore: 112, awayScore: 108, round: "NBA Finals - Game 3", status: "completed" },
      { id: "f4", homeTeam: "thunder", awayTeam: "celtics", dateTime: "2025-06-13T21:00", venue: "Paycom Center, Oklahoma City", homeScore: 95, awayScore: 110, round: "NBA Finals - Game 4", status: "completed" },
      { id: "f5", homeTeam: "celtics", awayTeam: "thunder", dateTime: "2025-06-17T21:00", venue: "TD Garden, Boston", homeScore: 103, awayScore: 97, round: "NBA Finals - Game 5", status: "completed" },
      { id: "f6", homeTeam: "thunder", awayTeam: "celtics", dateTime: "2025-06-22T20:00", venue: "Paycom Center, Oklahoma City", homeScore: 98, awayScore: 104, round: "NBA Finals - Game 6", status: "completed" }
    ],
    bracket: null
  },
  {
    id: "wnba-2025-regular",
    name: "WNBA Regular Season 2025",
    sport: "basketball",
    category: "WNBA",
    status: "completed",
    dateStart: "2025-05-16",
    dateEnd: "2025-09-14",
    description: "The 29th WNBA season featuring 13 teams competing for playoff qualification across a 40-game schedule.",
    watchLink: null,
    teams: [
      { id: "aces", name: "Las Vegas Aces", seed: 1 },
      { id: "liberty", name: "New York Liberty", seed: 2 },
      { id: "fever", name: "Indiana Fever", seed: 3 },
      { id: "lynx", name: "Minnesota Lynx", seed: 4 }
    ],
    matches: [
      { id: "w1", homeTeam: "aces", awayTeam: "liberty", dateTime: "2025-05-16T22:00", venue: "Michelob Ultra Arena, Las Vegas", homeScore: 88, awayScore: 79, round: "Regular Season", status: "completed" },
      { id: "w2", homeTeam: "fever", awayTeam: "lynx", dateTime: "2025-05-17T19:00", venue: "Gainbridge Fieldhouse, Indianapolis", homeScore: 74, awayScore: 81, round: "Regular Season", status: "completed" },
      { id: "w3", homeTeam: "liberty", awayTeam: "fever", dateTime: "2025-06-01T13:00", venue: "Barclays Center, New York", homeScore: 91, awayScore: 83, round: "Regular Season", status: "completed" }
    ],
    bracket: null
  },
  {
    id: "wnba-2025-playoffs",
    name: "WNBA Playoffs 2025",
    sport: "basketball",
    category: "WNBA",
    status: "completed",
    dateStart: "2025-09-17",
    dateEnd: "2025-10-19",
    description: "The top 8 WNBA teams compete in a single-elimination first round followed by best-of-five series through the Finals.",
    watchLink: null,
    teams: [
      { id: "aces", name: "Las Vegas Aces", seed: 1 },
      { id: "liberty", name: "New York Liberty", seed: 2 },
      { id: "lynx", name: "Minnesota Lynx", seed: 3 },
      { id: "fever", name: "Indiana Fever", seed: 4 }
    ],
    matches: [
      { id: "wp1", homeTeam: "aces", awayTeam: "fever", dateTime: "2025-09-17T22:00", venue: "Michelob Ultra Arena, Las Vegas", homeScore: 84, awayScore: 76, round: "First Round", status: "completed" },
      { id: "wp2", homeTeam: "liberty", awayTeam: "lynx", dateTime: "2025-09-18T19:00", venue: "Barclays Center, New York", homeScore: 79, awayScore: 82, round: "First Round", status: "completed" },
      { id: "wp3", homeTeam: "aces", awayTeam: "lynx", dateTime: "2025-10-01T22:00", venue: "Michelob Ultra Arena, Las Vegas", homeScore: 91, awayScore: 85, round: "Semifinals", status: "completed" }
    ],
    bracket: [
      { name: "First Round", matches: ["wp1","wp2"] },
      { name: "Semifinals", matches: ["wp3"] },
      { name: "Finals", matches: ["wp4"] }
    ]
  },
  {
    id: "wnba-2025-finals",
    name: "WNBA Finals 2025",
    sport: "basketball",
    category: "WNBA",
    status: "completed",
    dateStart: "2025-10-08",
    dateEnd: "2025-10-19",
    description: "The Las Vegas Aces defended their title against the Minnesota Lynx, winning the series 3–1.",
    watchLink: null,
    teams: [
      { id: "aces", name: "Las Vegas Aces", seed: 1 },
      { id: "lynx", name: "Minnesota Lynx", seed: 3 }
    ],
    matches: [
      { id: "wf1", homeTeam: "aces", awayTeam: "lynx", dateTime: "2025-10-08T22:00", venue: "Michelob Ultra Arena, Las Vegas", homeScore: 87, awayScore: 79, round: "WNBA Finals - Game 1", status: "completed" },
      { id: "wf2", homeTeam: "aces", awayTeam: "lynx", dateTime: "2025-10-10T22:00", venue: "Michelob Ultra Arena, Las Vegas", homeScore: 76, awayScore: 84, round: "WNBA Finals - Game 2", status: "completed" },
      { id: "wf3", homeTeam: "lynx", awayTeam: "aces", dateTime: "2025-10-14T19:00", venue: "Target Center, Minneapolis", homeScore: 71, awayScore: 89, round: "WNBA Finals - Game 3", status: "completed" },
      { id: "wf4", homeTeam: "lynx", awayTeam: "aces", dateTime: "2025-10-19T15:00", venue: "Target Center, Minneapolis", homeScore: 80, awayScore: 93, round: "WNBA Finals - Game 4", status: "completed" }
    ],
    bracket: null
  },
  {
    id: "olympic-basketball-2028",
    name: "Olympic Basketball 2028",
    sport: "basketball",
    category: "International",
    status: "upcoming",
    dateStart: "2028-07-22",
    dateEnd: "2028-08-12",
    description: "Men's and women's basketball at the Los Angeles 2028 Olympic Games. 12 national teams compete in each tournament.",
    watchLink: null,
    teams: [
      { id: "usa-m", name: "USA Men" },
      { id: "france-m", name: "France Men" },
      { id: "serbia-m", name: "Serbia Men" },
      { id: "usa-w", name: "USA Women" },
      { id: "australia-w", name: "Australia Women" }
    ],
    matches: [],
    bracket: null
  },
  {
    id: "fiba-world-cup-2027",
    name: "FIBA Basketball World Cup 2027",
    sport: "basketball",
    category: "International",
    status: "upcoming",
    dateStart: "2027-08-22",
    dateEnd: "2027-09-12",
    description: "The 20th FIBA Basketball World Cup, featuring 32 national men's teams competing for the world championship title.",
    watchLink: null,
    teams: [
      { id: "usa", name: "USA" },
      { id: "serbia", name: "Serbia" },
      { id: "germany", name: "Germany" },
      { id: "canada", name: "Canada" },
      { id: "australia", name: "Australia" }
    ],
    matches: [],
    bracket: null
  },
  {
    id: "fiba-womens-world-cup-2026",
    name: "FIBA Women's Basketball World Cup 2026",
    sport: "basketball",
    category: "International",
    status: "upcoming",
    dateStart: "2026-09-19",
    dateEnd: "2026-10-04",
    description: "The women's basketball world championship featuring 12 national teams competing across group stage and knockout rounds.",
    watchLink: null,
    teams: [
      { id: "usa-w", name: "USA" },
      { id: "australia-w", name: "Australia" },
      { id: "china-w", name: "China" },
      { id: "spain-w", name: "Spain" }
    ],
    matches: [],
    bracket: null
  },
  {
    id: "ncaa-march-madness-2026",
    name: "NCAA March Madness 2026",
    sport: "basketball",
    category: "College",
    status: "upcoming",
    dateStart: "2026-03-17",
    dateEnd: "2026-04-06",
    description: "The 2026 NCAA Division I Men's Basketball Tournament — 68 teams compete in a single-elimination bracket for the national title.",
    watchLink: null,
    teams: [
      { id: "duke", name: "Duke Blue Devils", seed: 1 },
      { id: "kansas", name: "Kansas Jayhawks", seed: 2 },
      { id: "kentucky", name: "Kentucky Wildcats", seed: 3 },
      { id: "gonzaga", name: "Gonzaga Bulldogs", seed: 4 }
    ],
    matches: [],
    bracket: null
  }
];

// ============================================================
// MAIN: getBasketballData()
// This is what your competitions.html and detail.html call.
// Fetches live NBA data, then combines with static data below.
// ============================================================
async function getBasketballData() {
  const liveNBA = await buildNBARegularSeason();
  return [liveNBA, ...STATIC_BASKETBALL_DATA];
}

// ============================================================
// Make getBasketballData available to the rest of your app
// ============================================================
window.getBasketballData = getBasketballData;
