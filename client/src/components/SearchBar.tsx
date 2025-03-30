import {FormEvent} from "react";

interface Props {
    fetchVideo(url: string): void
}


function SearchBar(props: Readonly<Props>) {

    function handleSubmit(e: FormEvent) {
        // Prevent the browser from reloading the page
        e.preventDefault();

        const form = e.target;
        // @ts-expect-error working
        const formData = new FormData(form);

        props.fetchVideo(formData.get("ytLink") as string)
    }


    return (

        <div className="container mt-4" style={{maxWidth: 60 + 'rem'}}>
            <form className="row" method="get" onSubmit={handleSubmit}>
                <div className="col">
                    <input type="url" className="form-control" name="ytLink" placeholder="Enter YouTube URL here"/>
                </div>
                <div className="col-auto">
                    <button type="submit" className="btn btn-primary">
                        <strong>Open</strong>
                    </button>
                </div>
            </form>
        </div>
    )
}

export default SearchBar