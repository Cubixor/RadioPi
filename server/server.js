const {spawn, exec} = require('child_process')
const express = require('express')
const mysql = require('mysql2')
const app = express()

app.use(express.static('public'))


const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '12345',
    database: 'radio'
})

connection.connect()


let currVidData;
let currVidPlaying = null;


//for testing
/*currVidData = {
    url: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`,
    title: `Rick Astley - Never Gonna Give You Up (Official Music Video)`,
    thumbnail: `https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg`,
    duration: 212,
    time: 0,
    playing: false
}*/

function getYouTubeVideoId(url) {
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

function checkStreamURL(url) {
    return new Promise((resolve, reject) => {
        const ffprobe = spawn('ffprobe', [url])
        ffprobe.on('exit', (code) => {
            resolve(code === 0)
        })
    })
}

function exec_command(cmd, callback) {
    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }

        callback(stdout)
    });
}

function playVideo(onStartPlaying) {
    const ytVid = currVidData.type === `yt`

    const ffmpeg = spawn('ffmpeg', ['-i', ytVid ? 'pipe:0' : currVidData.url, '-f', 'wav', '-bitexact', '-acodec', 'pcm_s16le', '-ar', '22050', '-ac', '1', 'pipe:1']);
    const fm_transmitter = spawn('sudo', ['/home/fm_transmitter/fm_transmitter', '-f', '100.8', '-'])

    let stopSent = false;
    currVidPlaying = {}

    if (ytVid) {
        const yt_dlp = spawn('yt-dlp', ['-f', 'bestaudio', '--extract-audio', '--audio-format', 'mp3', '--audio-quality', '0', '-o', '-', currVidData.url]);
        yt_dlp.stdout.pipe(ffmpeg.stdin).on('error', (err) => {
            console.log(`yt-dlp -> ffmpeg pipe error: ${err}`)
        })
        yt_dlp.stderr.on('data', (data) => {
            console.error(`yt-dlp stderr: ${data}`)
        });
        yt_dlp.on('close', (code) => {
            console.log(`yt-dlp process exited with code ${code}`);
        });
        yt_dlp.on('error', (err) => {
            console.log(`yt-dlp err: ${err}`)
        })

        currVidPlaying.yt_dlp = yt_dlp
    }

    ffmpeg.stdout.pipe(fm_transmitter.stdin).on('error', (err) => {
        console.log(`ffmpeg -> fm_transmitter pipe error: ${err}`)
    })
    ffmpeg.stderr.on('data', (data) => {
        console.error(`ffpmeg stderr: ${data}`)
    });
    ffmpeg.on('close', (code) => {
        console.log(`ffmpeg process exited with code ${code}`);
    });
    ffmpeg.on('error', (err) => {
        console.log(`ffmpeg err: ${err}`)
    })

    fm_transmitter.stdout.on('data', (data) => {
        console.log(`fm_transmitter stdout: ${data}`);

        if (!stopSent && String(data).startsWith('Playing: STDIN')) {
            onStartPlaying()

            if (ytVid) {
                currVidPlaying.timeInterval = setInterval(() => {
                    currVidData.time++
                    console.log(`timer: ${currVidData.time}`)

                    if (currVidData.time >= currVidData.duration) {
                        stopPlayback(true)
                    }
                }, 1000)
            }

            stopSent = true;
        }
    });
    fm_transmitter.stderr.on('data', (data) => {
        console.error(`fm_transmitter stderr: ${data}`)
    });
    fm_transmitter.on('close', (code) => {
        console.log(`fm_transmitter process exited with code ${code}`);
    })
    fm_transmitter.on('error', (err) => {
        console.log(`fm_transmitter err: ${err}`)
    });

    currVidPlaying.ffmpeg = ffmpeg
    currVidPlaying.fm_transmitter = fm_transmitter


    currVidData.playing = true
}

function stopPlayback(finished) {
    if (currVidPlaying == null) return false
    const ytVid = currVidData.type === `yt`

    spawn('sudo', ['killall', 'fm_transmitter', '-s', 'INT'])
    !finished && spawn('sudo', ['kill', currVidPlaying.ffmpeg.pid, '-s', 'INT'])


    if (ytVid) {
        clearInterval(currVidPlaying.timeInterval)
        currVidData.time = 0
        !finished && spawn('sudo', ['kill', currVidPlaying.yt_dlp.pid, '-s', 'INT'])
    }

    currVidData.playing = false
    currVidPlaying = null

    return true
}

function fetchYtVideo(link, videoID, res) {
    console.log(`Valid youtube link received! Video id: ${videoID} Fetching title and duration of the video...`)


    exec_command(`yt-dlp --print title --print duration ${link}`, (title) => {
        const split = title.split('\n')

        currVidData = {
            type: `yt`,
            url: link,
            thumbnail: `https://i.ytimg.com/vi/${videoID}/mqdefault.jpg`,
            title: split[0],
            duration: split[1],
            time: 0,
            playing: false
        }

        console.log(`Fetched video information. Sending data: ${JSON.stringify(currVidData)}`)

        res.json(currVidData)
    })
}

function sendStream(link, res) {
    currVidData = {
        type: `stream`,
        url: link,
        playing: false
    }

    console.log(`Valid stream link received! Sending data: ${JSON.stringify(currVidData)}`)
    res.json(currVidData)
}

app.delete('/api/video', (req, res) => {
    if (currVidData === undefined) {
        res.sendStatus(404);
        return;
    }

    stopPlayback(false)

    console.log(`Closing video: ${currVidData.url}`)
    currVidData = null
    res.sendStatus(200)
})

app.post('/api/video/play', (req, res) => {
    if (currVidData === undefined) {
        res.sendStatus(404);
        return;
    }

    stopPlayback(false)

    console.log(`Playing video: ${currVidData.url}`)
    playVideo(() => {
        res.sendStatus(200)
    })
})

app.post('/api/video/stop', (req, res) => {
    if (currVidPlaying == null) {
        res.sendStatus(404);
        return;
    }

    console.log(`Stopping video playback...`)
    stopPlayback(false)
    res.sendStatus(200)
})

app.get('/api/video', (req, res) => {
    let link = req.query.link;
    if (link === undefined) {
        if (currVidData != null) {
            console.log(`No link received, sending last played`);

            res.json(currVidData)
            return;
        } else {
            console.log(`No link received, nothing in memory to send`);

            res.sendStatus(404)
            return;
        }
    }


    let videoID = getYouTubeVideoId(link)

    if (videoID != null) {
        stopPlayback(false)
        fetchYtVideo(link, videoID, res)
        return
    }

    if (videoID === null) {
        //Check if the link is a direct stream
        console.log(`Invalid youtube link received, checking if it's a valid stream link...`)

        checkStreamURL(link)
            .then((ok) => {
                if (!ok) {
                    console.log(`Invalid stream link received: ${link}`);
                    res.sendStatus(400);
                    return
                }

                stopPlayback(false)
                sendStream(link, res)
            })
    }

    /*
        if (currVidData != null && videoID === getYouTubeVideoId(currVidData.url)) {
            console.log(`Valid link received, video already in memory!`)
            res.json(currVidData)
            return;
        }
    */
})

app.get('/api/bookmarks', (req, res) => {
    connection.query('SELECT * FROM bookmarks', (err, rows, fields) => {
        if (err) throw err

        console.log(`Sending saved bookmarks: ${JSON.stringify(rows)}`)
        res.json(rows)
    })
})


app.post('/api/bookmark', (req, res) => {
    if (currVidData == null) {
        console.log(`No video to bookmark!`)
        res.sendStatus(400)
        return
    }

    connection.query(`INSERT INTO bookmarks
                      VALUES (?, ?, ?, ?)`, [currVidData.url, currVidData.type, currVidData.title, currVidData.duration], (err, rows, fields) => {
        console.log(`Saved current video to bookmarks`)
        res.sendStatus(200)
    })
})

app.delete('/api/bookmark', (req, res) => {
    let url = req.query.url;
    if (url === undefined) {
        res.sendStatus(400)
        return
    }

    connection.query(`DELETE
                      FROM bookmarks
                      WHERE url = ?`, [url], (err, rows, fields) => {
        if (err) throw err

        console.log(`Deleted bookmark with id ${url} from database!`)
        res.sendStatus(200)
    })
})

app.listen(5000, () => {
    console.log(`Listening on 5000!`)
})
