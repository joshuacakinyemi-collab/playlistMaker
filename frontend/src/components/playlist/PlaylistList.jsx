import PlaylistItem from './PlaylistItem.jsx';

function PlaylistList({ playlists, loadPlaylists, onSelectPlaylist }) {
  return (
    <ul id="playlist-list">
      {playlists.map((playlist) => (
        <PlaylistItem
          key={playlist.playlist_id}
          playlist={playlist}
          loadPlaylists={loadPlaylists}
          onSelectPlaylist={onSelectPlaylist} // pass it down
        />
      ))}
    </ul>
  );
}


export default PlaylistList;
