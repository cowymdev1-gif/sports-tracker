# SportTrack

A sports competition tracking web app. Built as a prototype with mock data.

## Structure

```
sports-tracker/
├── index.html           # Homepage – sport selector
├── competitions.html    # List of competitions for a sport
├── detail.html          # Competition detail page
├── css/
│   └── styles.css
└── js/
    └── data/
        └── basketball.js   # Mock data (replace with API later)
```

## Running locally

Just open `index.html` in a browser. No build step needed.

## Swapping in a real API

All mock data lives in `js/data/basketball.js`.
The `BASKETBALL_DATA` array matches the data model below.
To connect a real API (TheSportsDB, NBA API, Sportradar, etc.):
1. Fetch data from the API
2. Transform the response to match the same shape
3. Replace `BASKETBALL_DATA` with the transformed array

## Data model

```js
Competition {
  id: string
  name: string
  sport: string
  category: string           // "NBA" | "WNBA" | "International" | "College"
  status: string             // "upcoming" | "ongoing" | "completed"
  dateStart: string          // "YYYY-MM-DD"
  dateEnd: string
  description: string
  watchLink: string | null
  teams: Team[]
  matches: Match[]
  bracket: Round[] | null
}

Team {
  id: string
  name: string
  seed?: number
}

Match {
  id: string
  homeTeam: string           // team id
  awayTeam: string           // team id
  dateTime: string           // "YYYY-MM-DDTHH:MM"
  venue?: string
  homeScore: number | null
  awayScore: number | null
  round: string
  status: "upcoming" | "live" | "completed"
}

Round {
  name: string
  matches: string[]          // match ids
}
```

## Adding more sports

1. Create `js/data/tennis.js` with a `TENNIS_DATA` array using the same shape
2. Add a sport card to `index.html`
3. Update `competitions.html` to load the right data based on the `?sport=` param
