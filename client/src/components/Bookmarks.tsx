import {useContext} from "react";
import { BookmarkData, BookmarksContext} from "../App.tsx";
import Bookmark from "./Bookmark.tsx";

interface Props {
    fetchVideo(url: string): void
}

function Bookmarks(props: Readonly<Props>) {
    const [bookmarks, setBookmarks] = useContext(BookmarksContext)


    return bookmarks.map((bookmark: BookmarkData) =>
        <Bookmark key={bookmark.url}
                  bookmarkData={bookmark}
                  delete={() =>
                      setBookmarks(prevState => prevState?.filter(element => element !== bookmark))
                  }
                  fetchVideo={() => props.fetchVideo(bookmark.url)}
        ></Bookmark>)
}

export default Bookmarks