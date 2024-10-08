import { ActionFunction, json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import invariant from "tiny-invariant";
import { requireUserId } from "~/session.server";
import { getNote, Note } from "~/models/note.server";
import { Friends, getFriends } from "~/models/friends.server";
import { Form, useLoaderData } from "@remix-run/react";
import { recommendMovie } from "~/models/recommendation.server";
import { getProfileByEmail } from "~/models/user.server";


type LoaderData = {
    note: Note;
    friends: Friends;
}

export async function loader({ request, params }: LoaderFunctionArgs) {
    const userId = await requireUserId(request);
    invariant(params.movieId, "noteId not found");
  
    const note = await getNote({ userId, id: params.movieId });
    if (!note) {
      throw new Response("Not Found", { status: 404 });
    }

    const friends = await getFriends({ userId });

    if (!friends) {
        throw new Response("Not Found", { status: 404 });
    }
  
    return json({ note, friends });
}

export const action: ActionFunction = async ({ request, params }) => {
    const userId = await requireUserId(request);
    invariant(params.movieId, "movieId not found");
    const movieId: string = params.movieId;

    const formData = await request.formData();
    const friend = formData.get("friend");
    const comment = formData.get("comment");
    
    if (typeof friend !== "string") {
        return json({ errors: { friend: "Friend not found" } }, { status: 400 });
    }

    const friendId = await getProfileByEmail(friend);

    if (!friendId || typeof friendId === "string") {
        return json({ errors: { friend: "Friend not found" } }, { status: 400 });
    }

    if (typeof comment !== "string") {
        return json({ errors: { comment: "Comment not found" } }, { status: 400 });
    }

    await recommendMovie({ recommender: userId, recommendee: friendId.id, movie_id: movieId, comment: comment});

    return redirect(`/notes/${movieId}`);
}

export default function RecommendMoviePage() {
    const data = useLoaderData<typeof loader>() as LoaderData;

    return (
        <div>
            <h3 className="text-2xl font-bold"> Recommend {data.note.title}</h3>

            <Form method="post">
                <select name="friend" className="bg-gray-200 rounded-md p-2 mb-4">
                    {data.friends.friends.map((friend) => (
                        <option value={friend}>{friend}</option>
                    ))}
                </select>
                <br />
                <textarea name="comment" placeholder="Comment" className="bg-gray-200 rounded-md p-2 mb-4" />
                <br />
                <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Recommend</button>
            </Form>
        </div>
    )
}