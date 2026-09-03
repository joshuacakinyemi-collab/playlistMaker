const playlistModel = require('../models/playlistModel');

module.exports.listPlaylists = async (req, res, next) => {
  try {
    const playlists = await playlistModel.listByUser(req.session.user_id);
    res.send(playlists);
  } catch (err) {
    next(err);
  }
};

module.exports.listPublicPlaylists = async (req, res, next) => {
  try {
    const playlists = await playlistModel.listPublic();
    res.send(playlists);
  } catch (err) {
    next(err);
  }
};

module.exports.createPlaylist = async (req, res, next) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) return res.status(400).send({ error: 'Title and description are required.' });
    const playlist = await playlistModel.create(title, description, req.session.user_id);
    res.status(201).send(playlist);
  } catch (err) {
    next(err);
  }
};

module.exports.updatePlaylist = async (req, res, next) => {
  try {
    const { playlist_id } = req.params;
    const playlist = await playlistModel.find(playlist_id);
    if (!playlist) return res.status(404).send({ error: 'Playlist not found.' });
    if (playlist.user_id !== req.session.user_id) return res.status(403).send({ error: 'Not authorized.' });
    const updatedPlaylist = await playlistModel.update(playlist_id, req.body);
    res.send(updatedPlaylist);
  } catch (err) {
    next(err);
  }
};

module.exports.updateVisibility = async (req, res, next) => {
  try {
    const { playlist_id } = req.params;
    const { is_public } = req.body;
    const playlist = await playlistModel.find(playlist_id);
    if (!playlist) return res.status(404).send({ error: 'Playlist not found.' });
    if (playlist.user_id !== req.session.user_id) return res.status(403).send({ error: 'Not authorized.' });
    const updatedPlaylist = await playlistModel.updateVisibility(playlist_id, is_public);
    res.send(updatedPlaylist);
  } catch (err) {
    next(err);
  }
};

module.exports.deletePlaylist = async (req, res, next) => {
  try {
    const { playlist_id } = req.params;
    const playlist = await playlistModel.find(playlist_id);
    if (!playlist) return res.status(404).send({ error: 'Playlist not found.' });
    if (playlist.user_id !== req.session.user_id) return res.status(403).send({ error: 'Not authorized.' });
    const destroyedPlaylist = await playlistModel.destroy(playlist_id);
    res.send(destroyedPlaylist);
  } catch (err) {
    next(err);
  }
};
