# Playlist App — Full-Stack Case Study

WebPage(Broken Link): https://full-stack-project-remix-joshuacakinyemi.onrender.com

A full-stack Playlist app built with React, Express, and Postgres. Demonstrates session-based authentication, session rehydration, auth-dependent data fetching, and conditional rendering — the same patterns students use in their full-stack projects.

This is meant for people who want to share and/or Make a stylize playlist.

## User Stories

**Auth**
- A user can register for an account with a username and password
- A user can log in to an existing account
- A user can log out
- A returning user who has an active session is automatically logged in when they revisit the app

**Playlists**
- A logged-in user can see all of their playlist
- A logged-in user can create a new playlist by entering a title and a description
- A logged-in user can make a public for other users to see, or keep it private 
- A logged-in user can delete a playlists

**Songs**
- A logged-in user can see all songs in a playlist(or any user if the playlist is public)
- A logged-in user can add a new song by entering a title
- A logged-in user can mark a todo as complete or incomplete
- A logged-in user can delete a todo

## Schema

```
users
─────────────────────────────
user_id       SERIAL PRIMARY KEY
username      TEXT UNIQUE NOT NULL
password_hash TEXT NOT NULL

playlists
─────────────────────────────
playlist_id     SERIAL PRIMARY KEY,
title       TEXT NOT NULL,
description    TEXT NOT NULL,
is_public BOOLEAN NOT NULL DEFAULT FALSE,
user_id     INT REFERENCES users(user_id) ON DELETE CASCADE

songs
─────────────────────────────
song_id     SERIAL PRIMARY KEY,
title       TEXT NOT NULL,
author      TEXT NOT NULL,
youtube_id  TEXT,
thumbnail   TEXT,
playlist_id     INT REFERENCES playlists(playlist_id) ON DELETE CASCADE
```

A user has many playlists. Deleting a user cascades to delete all of their playlists.
A playlist has many songs. Deleting a playlist cascades to delete all of their songs.

## API Contract

### Auth endpoints

| Method | Endpoint             | Request Body             | Response                          |
| ------ | -------------------- | ------------------------ | --------------------------------- |
| POST   | `/api/auth/register` | `{ username, password }` | `{ user_id, username }`           |
| POST   | `/api/auth/login`    | `{ username, password }` | `{ user_id, username }`           |
| DELETE | `/api/auth/logout`   | —                        | `{ message }`                     |
| GET    | `/api/auth/me`       | —                        | `{ user_id, username }` or `null` |

### Playlist endpoints (all require authentication)

| Method | Endpoint                                  | Request Body            | Response                                                    |
| ------ | ----------------------------------------- | ----------------------- | ----------------------------------------------------------- |
| GET    | `/api/playists`                           | —                       | `[{ playlist_id, title, description, is_public, user_id }]` |
| GET    | `/api/playists/public`                    | —                       | `[{ playlist_id, title, description, is_public, user_id }]` |
| POST   | `/api/playlists`                          | `{ title, description }`| `{ playlist_id, title, description, is_public, user_id }`   |
| PATCH  | `/api/playlists/:playlists_id`            | `{ title, description }`| `{ playlist_id, title, description, is_public, user_id }`   |
| PATCH  | `/api/playlists/:playlist_id/visibility`  | `{ is_public }`         | `{ playlist_id, title, description, is_public, user_id }`   |
| DELETE | `/api/playlists/:playlist_id`             | —                       | `{ playlist_id, title, description, is_public, user_id }`   |

### Song endpoints (all require authentication unless playlist is public, then viewing is allow)

| Method | Endpoint                             | Request Body        | Response                                     |
| ------ | -------------------------------------| ------------------- | -------------------------------------------- |
| GET    | `/api/playlists/:playlist_id/songs`  | —                   | `[{ song_id, title, author, playlist_id }]`  |
| POST   | `/api/playlists/:playlist_id/songs`  | `{ title , author}` | `{ song_id, title, author, playlist_id }`    |
| PATCH  | `/api/Songs/:Song_id`                | `{ title , author }`| `{ song_id, title, author, playlist_id }`    |
| DELETE | `/api/Songs/:Song_id`                | —                   | `{ song_id, title, author, playlist_id }`    |

### Youtube Data Handler (The thing that decide what song should be fetch)

| Method | Endpoint                             | Request Body        | Response                                     |
| ------ | -------------------------------------| ------------------- | -------------------------------------------- |
| GET    | `/api/songs/:song_id/youtube`        | —                   | `[{ song_id, youtube_id, thumbnail }]`  |

## Setup

### 1. Database

Create a local Postgres database:

```sh
createdb playlist_casestudy
```

### 2. Server

```sh
cd server
npm install
cp .env.template .env
```

Open `.env` and fill in your Postgres credentials and a session secret. Then seed the database:

```sh
npm run db:seed
```

Start the server:

```sh
npm run dev
```

The server runs on `http://localhost:8080`.

### 3. Frontend

In a second terminal:

```sh
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173`. The Vite dev proxy forwards all `/api` requests to the Express server so session cookies work correctly.

## Seed Users

After running `npm run db:seed`, these accounts are available:

| Username  | Password    |
| --------  | ----------- |
| DjRandom  | letmein123  |
| ImNotACat | tunaTreat06 |

## Application Structure

```
swe-casestudy-7-todo-app/
├── frontend/               # React app (Vite)
│   ├── src/
│   │   ├── App.jsx         # Root component: currentUser state, session rehydration, auth handlers
│   │   ├── adapters/
│   │   │   ├── auth-adapters.js  # Fetch adapters for /api/auth/* endpoints
│   │   │   ├── playlist-adapters.js  # Fetch adapters for /api/playlists/* endpoints
|   |   |   └── song-adapters.js  # Fetch adapters for /api/songs/* endpoints
|   |   |   
│   │   └── components/
|   |       ├── playlist/
|   |       |    ├── PlaylistPage.jsx    # Main app container (shown when logged in)
|   |       |    ├── AddPlaylistForm.jsx # Form to create a new Playlist
|   |       |    ├── PublicPlaylistsPage.jsx    # Renders a list of Playlists that are public to all users
|   |       |    ├── PlaylistsItem.jsx    # Renders a Playlist
|   |       |    └── PlaylistList.jsx # Renders a list of Playlists
|   |       |
|   |       └── song/
|   |       |    ├── SongPage.jsx    # Main app container (shown when logged in)
|   |       |    ├── AddSongForm.jsx # Form to add a new Song to a Playlist
|   |       |    ├── PublicSongPage.jsx    # Renders a list of song in a public Playlists that all users can see
|   |       |    ├── SongItem.jsx    # Renders a song
|   |       |    └── SongList.jsx # Renders a list of song in a playlist
|   |       |
|   |       └── theme/
|   |       |    ├── ThemeControls.jsx    # Main app container (shown when logged in)
|   |       |    └── Visualizer.jsx # Form a bar that show while the music played
|   |       |
|   |       ├──ThemeContext.jsx # handle webpage accent color and light/dark mode
|   |       ├── music.jsx       # Song Player 
│   │       └── AuthPage.jsx    # Login + Register forms (shown when logged out)
|   |
│   └── vite.config.js      # Proxies /api requests to Express in development
└── server/                 # Express + Postgres API
    ├── index.js            # App entry point, route definitions
    ├── controllers/
    │   ├── authControllers.js  # register, login, logout, getMe
    │   ├── playlistControllers.js  # list, create, update, update,  delete playlists
    |   └── songControllers.js  # list, create, update, delete songs
    ├── models/
    │   ├── userModel.js    # SQL queries for the users table
    |   ├── playlistModel.js    # SQL queries for the playlists table
    │   └── songModel.js    # SQL queries for the songs table
    ├── utils/youtubeSearch.js # fetch for youtube song
    ├── middleware/
    │   ├── checkAuthentication.js  # Blocks unauthenticated requests
    │   └── logRoutes.js            # Logs each incoming request
    └── db/
        ├── pool.js         # Postgres connection pool
        └── seed.js         # Creates tables and inserts sample data
```
