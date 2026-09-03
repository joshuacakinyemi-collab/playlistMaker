const songModel = require('../models/songModel');
const playlistModel = require('../models/playlistModel');

const verifyOwnership = async (song, session_user_id, res) => {
  const playlist = await playlistModel.find(song.playlist_id);
  if (playlist.user_id !== session_user_id) {
    res.status(403).send({ error: 'Not authorized.' });
    return false;
  }
  return true;
};

module.exports.listSongs = async (req, res, next) => {
  try {
    const { playlist_id } = req.params;
    const songs = await songModel.listByPlaylist(playlist_id);
    res.send(songs);
  } catch (err) {
    next(err);
  }
};

module.exports.createSong = async (req, res, next) => {
  try {
    const { playlist_id } = req.params;
    const { title, author, youtube_id, thumbnail } = req.body;
    if (!title || !author) return res.status(400).send({ error: 'Title and author are required.' });
    const song = await songModel.create(title, author, playlist_id, youtube_id || null, thumbnail || null);
    res.status(201).send(song);
  } catch (err) {
    next(err);
  }
};

module.exports.updateSong = async (req, res, next) => {
  try {
    const { song_id } = req.params;
    const song = await songModel.find(song_id);
    if (!song) return res.status(404).send({ error: 'Song not found.' });
    if (!(await verifyOwnership(song, req.session.user_id, res))) return;
    const updatedSong = await songModel.update(song_id, req.body);
    res.send(updatedSong);
  } catch (err) {
    next(err);
  }
};

module.exports.deleteSong = async (req, res, next) => {
  try {
    const { song_id } = req.params;
    const song = await songModel.find(song_id);
    if (!song) return res.status(404).send({ error: 'Song not found.' });
    if (!(await verifyOwnership(song, req.session.user_id, res))) return;
    const destroyedSong = await songModel.destroy(song_id);
    res.send(destroyedSong);
  } catch (err) {
    next(err);
  }
};
