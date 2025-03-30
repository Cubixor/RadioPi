import {BookmarksContext, VideoData, VideoDataContext} from "../App"
import {useContext, useEffect, useState} from "react";

enum MediaState {
    Stopped, Playing, Loading
}

function MediaPlayer() {
    const [videoData, setVideoData] = useContext(VideoDataContext)
    const [bookmarks, setBookmarks] = useContext(BookmarksContext)

    const [playing, setPlaying] = useState<MediaState>(videoData.playing ? MediaState.Playing : MediaState.Stopped)
    const [time, setTime] = useState<number>(videoData.time ?? 0)

    function handlePlay() {
        setPlaying(MediaState.Loading)

        if (playing) {
            setPlaying(MediaState.Loading)

            fetch('/api/video/stop', {method: 'post'})
                .then((res) => {
                    if (res.status == 200) {
                        setPlaying(MediaState.Stopped)
                        setTime(0)
                    }
                })
        } else {
            setPlaying(MediaState.Loading)

            fetch('/api/video/play', {method: 'post'})
                .then((res) => {
                        if (res.status == 200) {
                            setPlaying(MediaState.Playing)
                            setTime(0)

                        }
                    }
                )
        }
    }

    function handleClose() {
        fetch('/api/video', {method: 'delete'})
            .then((res) => {
                if (res.status == 200) {
                    setVideoData({} as VideoData)
                }
            })
    }

    function handleBookmark() {
        const index = bookmarks.findIndex((bm) => bm.url === videoData.url);
        if (index !== -1) {
            const bookmark = bookmarks[index];

            fetch('/api/bookmark?' + new URLSearchParams({url: bookmark.url}).toString(), {method: 'delete'})
                .then((res) => {
                    if (res.ok) {
                        console.log(`Removed bookmark: ${bookmark.url}`)

                        setBookmarks(bookmarks.filter(b => b !== bookmark));
                    }
                })
        } else {

            fetch('/api/bookmark', {method: 'post'})
                .then((res) => {
                    if (res.ok) {
                        console.log(`Added bookmark: ${videoData.url}`)

                        setBookmarks([...bookmarks,
                            {
                                url: videoData.url,
                                type: videoData.type,
                                title: videoData.title,
                                duration: videoData.duration
                            }
                        ])
                    }
                })
        }
    }

    const ytVideo = videoData.type == `yt`

    useEffect(() => {
        if (playing == MediaState.Playing && ytVideo) {
            const timer = setTimeout(() => {
                setTime(prevState => prevState + 1);
                console.log(`timer: ${time}`)

                if (time == videoData.duration) {
                    setPlaying(MediaState.Stopped)
                    clearTimeout(timer)
                }
            }, 1000, [time])

            return () => clearTimeout(timer)
        }

    })

    const timeProg = ytVideo ? (time / videoData.duration * 100) : 100

    const playIcon = <path
        d="M 14.333 9.227 L 3.126 15.73 C 2.175 16.281 0.955 15.614 0.955 14.502 L 0.955 1.497 C 0.955 0.388 2.174 -0.282 3.126 0.271 L 14.333 6.774 C 15.278 7.313 15.284 8.672 14.345 9.22 C 14.341 9.223 14.337 9.225 14.333 9.227"/>
    /*<path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393"/>*/
    const stopIcon = <path d="M5 3.5h6A1.5 1.5 0 0 1 12.5 5v6a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 11V5A1.5 1.5 0 0 1 5 3.5"/>


    return (
        <div className="mt-5 container text-center" style={{maxWidth: 60 + 'rem'}}>
            <div className="mx-0 card">
                <button type="button" className="btn-close position-absolute" style={{top: 10, right: 10}} aria-label="Close"
                        onClick={handleClose}></button>
                <div className="card-body row mx-0">
                    <img className={videoData.thumbnail == '/radio_512.png' ? "col-2 mx-2" : "col-3 img-thumbnail"}
                         style={{padding: 0, height: 100 + '%'}}
                         src={videoData.thumbnail}/>
                    <div className="col container d-flex flex-column justify-content-between ms-1">

                        <div className="row">
                            <div className="col h4">{videoData.title}</div>
                        </div>


                        <div className="row">
                            <div className="col">

                                {playing != MediaState.Loading ?
                                    <div className="mb-1">
                                        <button type="button" className="btn" onClick={handlePlay}>
                                            <svg xmlns="http://www.w3.org/2000/svg" height="2rem" width="2rem" fill="currentColor"
                                                 className="bi text-primary img-fluid" viewBox="0 0 16 16">
                                                {playing === MediaState.Playing ? stopIcon : playIcon}
                                            </svg>
                                        </button>
                                        <button type="button" className="btn" onClick={handleBookmark}>
                                            <svg xmlns="http://www.w3.org/2000/svg" height="2rem" width="2rem" fill="currentColor"
                                                 className="bi text-primary img-fluid" viewBox="0 0 16 16">
                                                {bookmarks.some((bm) => bm.url === videoData.url) ?
                                                    <path
                                                        d="M2 2v13.5a.5.5 0 0 0 .74.439L8 13.069l5.26 2.87A.5.5 0 0 0 14 15.5V2a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2"/>
                                                    :
                                                    <path
                                                        d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.777.416L8 13.101l-5.223 2.815A.5.5 0 0 1 2 15.5zm2-1a1 1 0 0 0-1 1v12.566l4.723-2.482a.5.5 0 0 1 .554 0L13 14.566V2a1 1 0 0 0-1-1z"/>
                                                }
                                            </svg>
                                        </button>
                                    </div>
                                    :
                                    <div className="text-center my-2 text-primary">
                                        <div className="spinner-border " role="status"></div>
                                    </div>
                                }


                                <div className="progress" role="progressbar" style={{height: 10 + 'px'}}>
                                    <div className="progress-bar" style={{width: timeProg + '%'}}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MediaPlayer;