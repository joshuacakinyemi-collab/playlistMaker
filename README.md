# Playlist Maker — Desktop App

A desktop playlist app built with Electron + React. Everything runs locally on your machine — no server, no accounts. Search YouTube for songs using your own YouTube Data API key, build playlists, and hand a playlist to a friend as a copy-pasteable share code.

## Features

- Create, edit, and delete playlists and songs, all stored locally on your device
- Search YouTube for a song and attach it, using your own free YouTube API key (Settings)
- Play a playlist with a built-in music player
- Turn a playlist into a share code (Share button) and import someone else's code (My Playlists → Import)

## ⚠️ You need your own YouTube API key

This app does **not** ship with a YouTube API key — every person running it provides their own, and it's stored only on their own device (never committed to this repo, never sent anywhere but Google). Without a key, searching for and playing songs won't work.

To get one (free):
1. Go to the [Google Cloud Console](https://console.cloud.google.com/) and create a project (or pick an existing one).
2. Open **APIs & Services → Library**, search for **YouTube Data API v3**, and click **Enable**.
3. Go to **APIs & Services → Credentials → Create Credentials → API key**, then copy the key.
4. Open the app, click the **⚙ Settings** button in the top bar, paste the key in, and click **Save**.

## Setup

```sh
git clone git@github.com:joshuacakinyemi-collab/playlistMaker.git
cd playlistMaker
npm install
npm --prefix frontend install
```

Then follow the [API key steps above](#️-you-need-your-own-youtube-api-key) once the app is running.

## Development

```sh
npm run dev
```

This runs the Vite dev server and launches Electron pointed at it, with hot reload.

## Building a distributable

```sh
npm run dist
```

Builds the frontend and packages the app (via `electron-builder`) for the current OS into `release/`.

## Application Structure

```
playlistMaker/
├── build/
│   └── icon.png              # App icon, used by electron-builder for packaging
├── electron/                # Main process (Node) — no server, no network except YouTube search
│   ├── main.js               # Creates the window, registers all IPC handlers
│   ├── preload.js             # Exposes window.api to the renderer via contextBridge
│   ├── store.js               # electron-store-backed local playlist/song/settings data
│   ├── youtube.js             # YouTube Data API search, using the user's own API key
│   └── share.js                # Encodes/decodes a playlist into a shareable code
└── frontend/                 # React app (Vite), the renderer process
    └── src/
        ├── App.jsx             # Root component + the app's window chrome (titlebar, sidebar)
        ├── adapters/
        │   ├── playlist-adapters.js  # window.api.playlists.* wrappers
        │   ├── song-adapters.js      # window.api.songs.* wrappers
        │   └── settings-adapters.js  # window.api.settings.* wrappers
        └── components/
            ├── SettingsModal.jsx    # YouTube API key entry
            ├── playlist/            # Playlist library, item, add/import forms
            └── song/                # Song list/item, add-song (YouTube search), player page
```

## How playlist data (and your API key) is stored

Playlists, songs, and your YouTube API key live in a single local JSON file managed by `electron-store`, in the OS's standard app-data directory (e.g. `~/Library/Application Support/Playlist Maker` on macOS). This lives outside the project folder, so it's untouched by git — cloning, pulling, or resetting this repo never affects your saved playlists or key. There is no database server and nothing leaves your machine except the YouTube requests you make.
