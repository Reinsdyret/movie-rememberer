import type { ActionFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import type { Note } from "~/models/note.server";
import { deleteNote, getNote, toggleWatchedNote } from "~/models/note.server";
import { requireUserId } from "~/session.server";
import invariant from "tiny-invariant";

type LoaderData = {
  note: Note;
};

export async function loader({ request, params }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  invariant(params.noteId, "noteId not found");

  const note = await getNote({ userId, id: params.noteId });
  if (!note) {
    throw new Response("Not Found", { status: 404 });
  }

  return json({ note });
}

export const action: ActionFunction = async ({ request, params }) => {
  const userId = await requireUserId(request);
  invariant(params.noteId, "noteId not found");

  const formData = new URLSearchParams(await request.text());

  if (formData.get('action') === 'delete') {
    await deleteNote({ userId, id: params.noteId });
    return redirect("/notes");
  }

  if (formData.get('action') === 'toggleWatched') {
    await toggleWatchedNote({ userId, id: params.noteId });
    return redirect(`/notes/${params.noteId}`);
  }

  return redirect("/notes");
};

export default function NoteDetailsPage() {
  const data = useLoaderData<typeof loader>() as LoaderData;

  return (
    <div>
      <h3 className="text-2xl font-bold">{data.note.title}</h3>
      <img src={data.note.url} class="max-h-52 max-w-52 float-right" />
      <p className="py-6">{data.note.body}</p>
      <hr className="my-4" />
      <Form method="post">
        <input type="hidden" name="action" value="delete" />
        <button
          type="submit"
          className="rounded bg-red-500 py-2 px-4 text-white hover:bg-red-600 focus:bg-red-400"
        >
          Delete
        </button>
      </Form>
      <Form method="post" className="mt-4">
        <input type="hidden" name="action" value="toggleWatched" />
        <button
          type="submit"
          className="rounded bg-yellow-500 py-2 px-4 text-white hover:bg-yellow-600 focus:bg-yellow-400"
        >
          Toggle Watched
        </button>
      </Form>    </div>
  );
}
