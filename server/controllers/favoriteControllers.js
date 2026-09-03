const favoriteModel = require('../models/favoriteModel');
const playlistModel = require('../models/playlistModel');

module.exports.listFavorites = async (req, res, next) => {
  try {
    const playlists = await favoriteModel.listByUser(req.session.user_id);
    res.send(playlists);
  } catch (err) {
    next(err);
  }
};

module.exports.listFavoriteIds = async (req, res, next) => {
  try {
    const ids = await favoriteModel.listIdsByUser(req.session.user_id);
    res.send(ids);
  } catch (err) {
    next(err);
  }
};

module.exports.addFavorite = async (req, res, next) => {
  try {
    const { playlist_id } = req.params;
    const playlist = await playlistModel.find(playlist_id);
    if (!playlist) return res.status(404).send({ error: 'Playlist not found.' });
    if (!playlist.is_public) return res.status(403).send({ error: 'Cannot favorite a private playlist.' });
    const favorite = await favoriteModel.add(req.session.user_id, playlist_id);
    res.status(201).send(favorite || { message: 'Already favorited.' });
  } catch (err) {
    next(err);
  }
};

module.exports.removeFavorite = async (req, res, next) => {
  try {
    const { playlist_id } = req.params;
    const removed = await favoriteModel.remove(req.session.user_id, playlist_id);
    res.send(removed || { message: 'Not in favorites.' });
  } catch (err) {
    next(err);
  }
};
