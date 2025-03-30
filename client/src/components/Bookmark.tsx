import {BookmarkData} from "../App.tsx";
import {secondsToHHMMSS} from "../Utils.ts"

interface Props {
    bookmarkData: BookmarkData
    delete(): void
    fetchVideo(): void
}

function Bookmark(props: Readonly<Props>) {
    const yt = props.bookmarkData.type == `yt`

    function handleUnBookmark() {
        fetch('/api/bookmark?' + new URLSearchParams({url: props.bookmarkData.url}).toString(), {method: 'delete'})
            .then((res) => {
                if (res.ok) {
                    console.log(`Removed bookmark`)
                    props.delete()
                }
            })
    }


    return (
        <div className="container mt-4" style={{maxWidth: 60 + 'rem'}}>
            <div className=" mx-0 card">
                <div className="row m-2 align-items-center">
                    <div className="col-auto">
                        <img className="img-fluid " src={yt ? "/yt.png" : "/radio.png"}/>
                    </div>
                    <div className="col fs-5 text-secondary">
                        {props.bookmarkData.title || `STREAM: ${(new URL(props.bookmarkData.url)).hostname}`}
                    </div>
                    {props.bookmarkData.duration > 0 &&
                        <div className="col-auto fw-bold text-secondary me-0">
                            {secondsToHHMMSS(props.bookmarkData.duration)}
                        </div>}
                    <div className="col-auto">
                        <button type="button" className="btn text-primary me-3" style={{padding: 0}} onClick={props.fetchVideo}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="1.5rem" height="1.5rem" fill="currentColor"
                                 className="bi bi-bookmark-fill" viewBox="0 0 16 16">
                                {/*<path d="M 14.333 9.227 L 3.126 15.73 C 2.175 16.281 0.955 15.614 0.955 14.502 L 0.955 1.497 C 0.955 0.388 2.174 -0.282 3.126 0.271 L 14.333 6.774 C 15.278 7.313 15.284 8.672 14.345 9.22 C 14.341 9.223 14.337 9.225 14.333 9.227"/>*/}
                                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>
                            </svg>
                        </button>
                        <button type="button" className="btn text-primary" style={{padding: 0}} onClick={handleUnBookmark}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="1.5rem" height="1.5rem" fill="currentColor"
                                 className="bi bi-bookmark-fill" viewBox="0 0 16 16">
                                <path
                                    d="M2 2v13.5a.5.5 0 0 0 .74.439L8 13.069l5.26 2.87A.5.5 0 0 0 14 15.5V2a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Bookmark