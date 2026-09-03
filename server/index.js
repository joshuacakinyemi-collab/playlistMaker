const path = require('path');
const express = require('express');
const cookieSession = require('cookie-session');
require('dotenv').config();

const { initPool, getPool } = require('./db/pool');
const songModel = require('./models/songModel');

const logRoutes = require('./middleware/logRoutes');
const checkAuthentication = require('./middleware/checkAuthentication');

const authControllers = require('./controllers/authControllers');
const playlistControllers = require('./controllers/playlistControllers');
const songControllers = require('./controllers/songControllers');
const favoriteControllers = require('./controllers/favoriteControllers');

const { searchYouTube } = require('./utils/youtubeSearch');

const app = express();
const PORT = process.env.PORT || 8080;

// ====================================
// Middleware
// ====================================

app.use(logRoutes);
app.use(cookieSession({ name: 'session', secret: process.env.SESSION_SECRET }));
app.use(express.json());

app.use(express.static(path.join(__dirname, '../frontend/dist')));

// ====================================
// Auth routes
// ====================================

app.post('/api/auth/register', authControllers.register);
app.post('/api/auth/login', authControllers.login);
app.get('/api/auth/me', authControllers.getMe);
app.delete('/api/auth/logout', authControllers.logout);

// ====================================
// Playlist routes
// ====================================

app.get('/api/playlists', checkAuthentication, playlistControllers.listPlaylists);
app.get('/api/playlists/public', playlistControllers.listPublicPlaylists);
app.post('/api/playlists', checkAuthentication, playlistControllers.createPlaylist);
app.patch('/api/playlists/:playlist_id', checkAuthentication, playlistControllers.updatePlaylist);
app.patch('/api/playlists/:playlist_id/visibility', checkAuthentication, playlistControllers.updateVisibility);
app.delete('/api/playlists/:playlist_id', checkAuthentication, playlistControllers.deletePlaylist);

// ====================================
// Song routes
// ====================================

app.get('/api/playlists/:playlist_id/songs', songControllers.listSongs);
app.post('/api/playlists/:playlist_id/songs', checkAuthentication, songControllers.createSong);
app.patch('/api/songs/:song_id', checkAuthentication, songControllers.updateSong);
app.delete('/api/songs/:song_id', checkAuthentication, songControllers.deleteSong);

// ====================================
// Favorites routes
// ====================================

app.get('/api/favorites', checkAuthentication, favoriteControllers.listFavorites);
app.get('/api/favorites/ids', checkAuthentication, favoriteControllers.listFavoriteIds);
app.post('/api/favorites/:playlist_id', checkAuthentication, favoriteControllers.addFavorite);
app.delete('/api/favorites/:playlist_id', checkAuthentication, favoriteControllers.removeFavorite);

// ====================================
// YouTube routes
// ====================================

app.get('/api/youtube/search', async (req, res, next) => {
  try {
    const { title, author } = req.query;
    if (!title || !author) return res.status(400).send({ error: 'title and author are required' });
    const results = await searchYouTube(title, author, 5);
    res.send(results);
  } catch (err) {
    next(err);
  }
});

app.get('/api/songs/:song_id/youtube', async (req, res, next) => {
  try {
    const { song_id } = req.params;
    const song = await songModel.find(song_id);
    if (!song) return res.status(404).send({ error: 'Song not found.' });

    if (song.youtube_id) {
      return res.send({ youtube_id: song.youtube_id, thumbnail: song.thumbnail });
    }

    const result = await searchYouTube(song.title, song.author);
    if (!result) return res.status(404).send({ error: 'No YouTube result found.' });

    await getPool().query(
      'UPDATE songs SET youtube_id = $1, thumbnail = $2 WHERE song_id = $3',
      [result.youtube_id, result.thumbnail, song_id]
    );

    res.send(result);
  } catch (err) {
    next(err);
  }
});

// ====================================
// Global Error Handler
// ====================================

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send({ message: 'Internal Server Error' });
});

// ====================================
// Start — open DB connection first, then listen
// ====================================

initPool()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to connect to database:', err);
    process.exit(1);
  });
