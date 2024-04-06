const http = require('http');
const fs = require('fs');

/* ============================ SERVER DATA ============================ */
let artists = JSON.parse(fs.readFileSync('./seeds/artists.json'));
let albums = JSON.parse(fs.readFileSync('./seeds/albums.json'));
let songs = JSON.parse(fs.readFileSync('./seeds/songs.json'));

let nextArtistId = 2;
let nextAlbumId = 2;
let nextSongId = 2;

// returns an artistId for a new artist
function getNewArtistId() {
  const newArtistId = nextArtistId;
  nextArtistId++;
  return newArtistId;
}

// returns an albumId for a new album
function getNewAlbumId() {
  const newAlbumId = nextAlbumId;
  nextAlbumId++;
  return newAlbumId;
}

// returns an songId for a new song
function getNewSongId() {
  const newSongId = nextSongId;
  nextSongId++;
  return newSongId;
}

/* ======================= PROCESS SERVER REQUESTS ======================= */
const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // assemble the request body
  let reqBody = "";
  req.on("data", (data) => {
    reqBody += data;
  });

  req.on("end", () => { // finished assembling the entire request body
    // Parsing the body of the request depending on the "Content-Type" header
    if (reqBody) {
      switch (req.headers['content-type']) {
        case "application/json":
          req.body = JSON.parse(reqBody);
          break;
        case "application/x-www-form-urlencoded":
          req.body = reqBody
            .split("&")
            .map((keyValuePair) => keyValuePair.split("="))
            .map(([key, value]) => [key, value.replace(/\+/g, " ")])
            .map(([key, value]) => [key, decodeURIComponent(value)])
            .reduce((acc, [key, value]) => {
              acc[key] = value;
              return acc;
            }, {});
          break;
        default:
          break;
      }
      console.log(req.body);
    }

    /* ========================== ROUTE HANDLERS ========================== */

    // Your code here

    // Get all the artists
    // GET /artists
    if (req.method === 'GET' && req.url === '/artists') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify(artists));
    }

    // Get a specific artist's details based on artistId
    // GET /artists/:artistId
    if (req.method === 'GET' && req.url.startsWith('/artists/')) {
      const urlParts = req.url.split('/') // ['', 'artists', '1']
      if (urlParts.length === 3) {
        const artistId = urlParts[2];
        const artistTarget = artists[artistId];

        if (!artistTarget) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          res.write("Artist Endpoint not found");
          return res.end();
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify(artistTarget));
      }

      return res.end();
    }

    // Add an artist
    // POST /artists
    if (req.method === 'POST' && req.url === '/artists') {
      const { name } = req.body;
      const artistId = getNewArtistId();
      const artist = { artistId, name };
      artists[artistId] = artist;

      res.writeHead(201, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(artist));
    }

    // Edit a specified artist by artistId
    // PUT or PATCH /artists/:artistId
    if ((req.method === 'PUT' || req.method === 'PATCH') && req.url.match(/^\/artists\/\d+$/)) {
      const { name } = req.body;
      const urlParts = req.url.split('/') // ['', 'artists', 1];
      const artistTargetId = urlParts[2];
      const artist = artists[artistTargetId];

      if (!artist) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          res.write("Artist with that ID not found");
          return res.end();
      }

      const editArtist = {
        artistId: artistTargetId,
        name: name || artist.name // change or not
      }

      artists[artistTargetId] = editArtist;

      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(editArtist));
    }

    // Delete a specified artist by artistId
    // DELETE /artists/:artistId
    if (req.method === 'DELETE' && req.url.match(/^\/artists\/\d+$/)) {
      const artistTargetId = req.url.split('/')[2];

      if (artists.hasOwnProperty(artistTargetId)) {
        delete artists[artistTargetId];
      }

      res.writeHead(200, { "Content-Type": "application/json" } );
      return res.end(JSON.stringify( { message: "Sucessfully deleted" } ));
    }

    // Get all albums of a specific artist based on artistId
    // GET /artists/:artistId/albums
    if (req.method === 'GET' && req.url.match(/^\/artists\/\d+\/albums/)) {
      const artistId = req.url.split('/')[2];
      const artist = artists[artistId];

      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(artist.albums || {}));
    }

    // Get a specific album's details based on albumId
    // GET /albums/:albumId
    if (req.method === 'GET' && req.url.match(/^\/albums\/\d+$/)) {
      const albumId = req.url.split('/')[2];
      const album = albums[albumId];
      if (album) {
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify(album || {}));
      }
    }

    // Add an album to a specific artist based on artistId
    // POST /artists/:artistId/albums
    if (req.method === 'POST' && req.url.match(/^\/artists\/\d+\/albums/)) {
      // [ '', 'artists', 1, 'albums' ]
      let artistId = req.url.split('/')[2];
      const artist = artists[artistId];

      if (artist) {
        const { name } = req.body;
        const albumId = getNewAlbumId();
        let numArtistId = Number(artistId);
        const album = { albumId, name, artistId: numArtistId }
        albums[albumId] = album;

        res.writeHead(201, { "Content-Type": "application/json" });
        return res.end(JSON.stringify(album || {}));
      }
    }

    // Edit a specified album by albumId
    // PUT|PATCH /albums/:albumId
    if ((req.method === 'PUT' || req.method === 'PATCH') && req.url.match(/^\/albums\/\d+$/)) {
      const { name } = req.body;
      const urlParts = req.url.split('/') // ['', 'albums', 1];
      const albumTargetId = urlParts[2];
      const album = albums[albumTargetId];

      if (!album) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          res.write("Album not found");
          return res.end();
      }

      const editAlbum = {
        albumId: album.albumId,
        name: name || album.name, // change or not,
        artistId: album.artistId
      }

      albums[albumTargetId] = editAlbum;

      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(editAlbum));
    }

    // Delete a specified album by albumId
    // DELETE /albums/:albumId
    if (req.method === 'DELETE' && req.url.match(/^\/albums\/\d+$/)) {
      const albumTargetId = req.url.split('/')[2];

      if (albums.hasOwnProperty(albumTargetId)) {
        delete albums[albumTargetId];
      }

      res.writeHead(200, { "Content-Type": "application/json" } );
      return res.end(JSON.stringify( { message: "Sucessfully deleted" } ));
    }

    // Get all songs of a specific artist based on artistId
    // GET /artists/:artistId/songs
    if (req.method === 'GET' && req.url.match(/^\/artists\/\d+\/songs/)) {
      const artistId = req.url.split('/')[2];
      const artistSongs = songs[artistId];

      if (artistSongs) {
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify(artistSongs || {}));
      }
    }

    // Get all songs of a specific album based on albumId
    // GET /albums/:albumId/songs
    if (req.method === 'GET' && req.url.match(/^\/albums\/\d+\/songs/)) {
      const albumId = req.url.split('/')[2];
      const albumSongs = albums[albumId];

      if (albumSongs) {
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify(albumSongs || {}));
      }
    }

    // Get all songs of a specified trackNumber
    // /trackNumbers/:trackNumberId/songs
    if (req.method === 'GET' && req.url.match(/^\/trackNumbers\/\d+\/songs/)) {
      const trackNumber = req.url.split('/')[2];
      const track = songs[trackNumber];

      if (track) {
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify(track || {}));
      }
    }

    // Get a specific song's details based on songId
    // GET /songs/:songId
    if (req.method === 'GET' && req.url.match(/^\/songs\/\d+$/)) {
      const songId = req.url.split('/')[2];
      const song = songs[songId];

      if (song) {
        song = {
          // fill with the actual song object
          ...songs[songId],
          // ...then fill out the additional info that is requested
          album: albums[songId],
          artist: artists[songId]
        }
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(song || {}));
    }

    // Add a song to a specific album based on albumId
    // POST /albums/:albumId
    if (req.method === 'POST' && req.url.match(/^\/albums\/\d+$/)) {
      const { name, lyrics, trackNumber } = req.body;
      const songId = getNewSongId();

      const song = {
        songId,
        name,
        trackNumber,
        albumId: getNewAlbumId(),
        lyrics
      }
      songs[songId] = song;

      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(song || {}));
    }

    // Edit a specified song by songId
    // PUT|PATCH /songs/:songId
    if ((req.method === 'PUT' || req.method === 'PATCH') && req.url.match(/^\/songs\/\d+$/)) {
      const songId = req.url.split('/')[2];
      const { name, lyrics } = req.body;
      const song = songs[songId];

      const editSong = {
        name: name || song.name,
        lyrics: lyrics || song.lyrics,
        trackNumber: song.trackNumber,
        songId: song.songId,
        albumId: song.albumId,
        album: albums[songId],
        artist: artists[songId]
      }
      songs[songId] = editSong;

      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(editSong || {}));
    }

    // Delete a specified song by songId
    // DELETE /songs/:songId
    if (req.method === 'DELETE' && req.url.match(/^\/songs\/\d+$/)) {
      const songId = req.url.split('/')[2];

      if (songs.hasOwnProperty(songId)) {
        delete songs[songId];

        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify( { message: "Sucessfully deleted" } ));
      }
    }


    /*************************************
     * 404 ERROR Route
     ************************************/
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.write("Endpoint not found");
    return res.end();
  });
});

const port = 5000;

server.listen(port, () => console.log('Server is listening on port', port));
