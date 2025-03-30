import React, {createContext, useEffect, useState} from "react";
import SearchBar from "./components/SearchBar"
import MediaPlayer from "./components/MediaPlayer.tsx";
import Bookmarks from "./components/Bookmarks.tsx";

export interface VideoData {
    type: string,
    url: string,
    title: string,
    thumbnail: string,
    duration: number,
    time: number,
    playing: boolean
}

export interface BookmarkData {
    url: string,
    type: string,
    title: string,
    duration: number
}

export const VideoDataContext = createContext<[VideoData, React.Dispatch<React.SetStateAction<VideoData>>]>([{} as VideoData, () => { }]);
export const BookmarksContext = createContext<[BookmarkData[], React.Dispatch<React.SetStateAction<BookmarkData[]>>]>([[], () => { }]);

function App() {
    const [data, setData] = useState<VideoData>({} as VideoData)
    const [bookmarks, setBookmarks] = useState<BookmarkData[]>([])

    const [loading, setLoading] = useState(false)
    const [alert, setAlert] = useState(false)


    function onFetch(response: VideoData) {
        const videoData: VideoData = {
            type: response.type,
            url: response.url,
            title: response.title || `STREAM: ${(new URL(response.url)).hostname}`,
            thumbnail: response.thumbnail || `/radio_512.png`,
            duration: response.duration || -1,
            time: response.time || -1,
            playing: response.playing
        }

        setData(videoData)
        setAlert(false)
    }

    function fetchVideo(url: FormDataEntryValue | null) {
        setLoading(true)
        fetch(`/api/video?link=${url}`, {method: "get"})
            .then(response => {
                setLoading(false)
                if (response.ok) {
                    return response.json()
                }
                throw new Error(response.status.toString())
            })
            .then(response => {
                console.log(JSON.stringify(response))

                onFetch(response)
            })
            .catch((error) => {
                console.log(`Error fetching the video data (probably invalid link) - ${error}`)

                setAlert(true)
            })
    }

    useEffect(() => {
        fetch(`/api/video`, {method: "get"})
            .then(response => {
                if (response.ok) {
                    return response.json()
                }
                throw new Error(response.status.toString())
            })
            .then(response => {
                onFetch(response)
            })
            .catch((error) => {
                console.log(`No video in memory - ${error}`)
            })

    }, [])

    useEffect(() => {
        fetch('/api/bookmarks', {method: 'get'})
            .then((res) => res.json())
            .then((res) => {
                setBookmarks(res as BookmarkData[])
            })
    }, []);


    const alertComp =
        <div className="alert alert-primary alert-dismissible container mt-2" role="alert" style={{maxWidth: 60 + 'rem'}}>
            <div>Invalid video link!</div>
            <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close" onClick={() => {
                setAlert(false)
            }}></button>
        </div>


    const loadingComp =
        <div className="text-center my-2 text-primary">
            <div className="spinner-border " role="status"/>
        </div>

    return (
        <VideoDataContext.Provider value={[data, setData]}>
            <BookmarksContext.Provider value={[bookmarks, setBookmarks]}>
                {alert && alertComp}
                {loading && loadingComp}
                {(!loading && (Object.keys(data).length != 0)) && <MediaPlayer/>}
                <SearchBar fetchVideo={fetchVideo}/>
                <Bookmarks fetchVideo={fetchVideo}/>
            </BookmarksContext.Provider>
        </VideoDataContext.Provider>
    );

}

export default App;
