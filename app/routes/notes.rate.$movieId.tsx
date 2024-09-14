import { ActionFunction, json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { getNote, Note } from "~/models/note.server";
import { createRating, Rating } from "~/models/rating.server";
import { requireUserId } from "~/session.server";


type LoaderData = {
    note: Note;
}

export async function loader({ request, params }: LoaderFunctionArgs) {
    const userId = await requireUserId(request);
    invariant(params.movieId, "noteId not found");
  
    const note = await getNote({ userId, id: params.movieId });
    if (!note) {
      throw new Response("Not Found", { status: 404 });
    }
  
    return json({ note });
}


export const action: ActionFunction = async ({ request, params }) => {
    const userId = await requireUserId(request);
    invariant(params.movieId, "movieId not found");
    const movie_id: string = params.movieId;

    const formData = await request.formData();
    const ratingForm = formData.get("rating");
    const comment = formData.get("comment");

    if (typeof ratingForm !== "string" || +ratingForm > 5 || +ratingForm < 0 || +ratingForm == null) {
        return json({ errors: { rating: `Rating must be 0 - 5 and it was ${ratingForm}` } }, { status: 400 });
    }

    if (typeof comment !== "string") {
        return json({ errors: { comment: "Comment was not a string" } }, {status: 400 });
    }

    const rating = +ratingForm;

    const ratingSaved = await createRating({ userId, movie_id, rating, comment });

    return redirect(`/notes/${params.movieId}`);
}

export default function RateMoviePage() {
    const data = useLoaderData<typeof loader>() as LoaderData;

    return (
        <div>
            <h3 className="text-2xl font-bold">Rate {data.note.title}</h3>
            <hr className="my-4" />
            <Form method="post">
                <div>
                    <label className="flex flex-col gap-1">Choose a rating:</label>
                    <select id="rating" name="rating">
                        <option value="0">☆☆☆☆☆</option>
                        <option value="1">★☆☆☆☆</option>
                        <option value="2">★★☆☆☆</option>
                        <option value="3">★★★☆☆</option>
                        <option value="4">★★★★☆</option>
                        <option value="5">★★★★★</option>
                    </select>
                </div>

                <div>
                    <label className="flex w-full flex-col gap-1">
                        <span>Comment: </span>
                        <textarea
                            name="comment"
                            rows={6}
                            className="flex-1 rounded-md border-2 border-blue-500 px-3 text-lg leading-loose"
                        ></textarea>
                    </label>
                </div>

                <div className="text-right">
                    <button
                        type="submit"
                        className="rounded bg-blue-500  py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400"
                    >
                    Save
                    </button>
                </div>
            </Form>
        </div>
    )
}