import SongItem from './SongItem.jsx';

function SongList({ songs, loadSongs }) {
  return (
    <ul id="song-list">
      {songs.map((song) => (
        <SongItem
          key={song.song_id}
          song={song}
          loadSongs={loadSongs}
        />
      ))}
    </ul>
  );
}

export default SongList;
