# Playlist Maker — Desktop App

A desktop playlist app built with Electron + React. Everything runs locally on your machine — no server, no accounts. Search YouTube for songs using your own YouTube Data API key, build playlists, and hand a playlist to a friend as a copy-pasteable share code.

## Features

- Create, edit, and delete playlists and songs, all stored locally on your device
- Search YouTube for a song and attach it, using your own free YouTube API key (Settings)
- A pocket-media-player style interface: menu screens you move through, a Now Playing screen, and a mini player along the bottom so music keeps playing while you browse
- Opening a playlist starts playing it; shuffle, loop, and skip work from any screen
- MP3 Player Mode shrinks the window to a pocket player (header icon, or Settings)
- Turn a playlist into a share code (Share button) and import someone else's code (Playlists → Import a Shared Playlist)
- Full game controller and keyboard support — navigate and play music without touching a mouse

## ⚠️ You need your own YouTube API key

This app does **not** ship with a YouTube API key — every person running it provides their own, and it's stored only on their own device (never committed to this repo, never sent anywhere but Google). Without a key, searching for and playing songs won't work.

To get one (free):
1. Go to the [Google Cloud Console](https://console.cloud.google.com/) and create a project (or pick an existing one).
2. Open **APIs & Services → Library**, search for **YouTube Data API v3**, and click **Enable**.
3. Go to **APIs & Services → Credentials → Create Credentials → API key**, then copy the key.
4. Open the app, click the **⚙** (Settings) button at the top right, paste the key in, and click **Save**.

## Keyboard

| Key | Action |
| --- | --- |
| Arrow keys | Move the selection bar |
| Enter / Space | Open or activate the selected item |
| Esc | Go back one screen |

## Controller support

Plug in an Xbox, PlayStation, or other standard-mapping USB/Bluetooth controller and it works automatically — no setup:

| Button | Action |
| --- | --- |
| D-pad / left stick | Move focus around the screen |
| A / Cross | Activate the focused button, or open the on-screen keyboard on a focused text field |
| B / Circle | Go back one screen (or leave MP3 Player Mode from the top screen) |
| Start | Open/close Settings |
| X / Square | Play / pause |
| LB, RB | Previous / next track |

Focusing any text field (playlist title, song search, your API key, a share code) and pressing A opens a fully controller-navigable on-screen keyboard — no physical keyboard needed:

| Button | Keyboard action |
| --- | --- |
| D-pad | Move between keys |
| A | Type the selected key |
| X | Toggle CAPS |
| Y | Switch between letters and numbers/symbols |
| B | Done (closes the keyboard and keeps what you typed) |

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
│   ├── share.js                # Encodes/decodes a playlist into a shareable code
│   └── staticServer.js         # Serves the built app over http://localhost (loopback only) —
│                                #   required for YouTube playback to work, see its comments
└── frontend/                 # React app (Vite), the renderer process
    └── src/
        ├── App.jsx             # Window chrome + screen-stack navigation (push/back, like an mp3 player's menus)
        ├── App.css             # All styling (media-player look, compact/MP3 mode, on-screen keyboard)
        ├── ThemeContext.jsx     # Dark/light + accent color, saved in the app's settings file
        ├── gamepad.js           # Controller + keyboard navigation: spatial focus movement + button actions
        ├── adapters/            # window.api.* wrappers that resolve to { data, error } (shared helper in call.js)
        ├── player/
        │   ├── PlayerContext.jsx  # App-wide music engine: hidden YouTube player, queue, shuffle, loop
        │   ├── NowPlaying.jsx     # Full Now Playing screen
        │   ├── MiniPlayer.jsx     # Now-playing strip along the bottom of other screens
        │   ├── Marquee.jsx        # Scrolling title text for names that don't fit
        │   └── Visualizer.jsx     # Animated bars
        ├── screens/             # Library, Playlist, Add Song, New/Edit Playlist, Import, Settings
        └── components/
            ├── Menu.jsx             # Menu list + row building blocks used by every screen
            ├── PocketPlayerIcon.jsx # MP3 Player Mode icon
            └── GamepadKeyboard.jsx  # Controller-navigable on-screen keyboard
```

## How playlist data (and your API key) is stored

Playlists, songs, and your YouTube API key live in a single local JSON file managed by `electron-store`, in the OS's standard app-data directory (e.g. `~/Library/Application Support/Playlist Maker` on macOS). This lives outside the project folder, so it's untouched by git — cloning, pulling, or resetting this repo never affects your saved playlists or key. There is no database server and nothing leaves your machine except the YouTube requests you make.
