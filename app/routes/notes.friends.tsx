import { ActionFunction, json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import invariant from "tiny-invariant";
import { addFriend, Friends, getFriends } from "~/models/friends.server"
import { getProfileByEmail } from "~/models/user.server";
import { requireUserId } from "~/session.server";


type LoaderData = {
  friends: Friends;
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);

  const friends = await getFriends({ userId });

  if (!friends) {
    throw new Response("Response not found", { status: 404 });
  }

  return json({ friends });
}

export const action: ActionFunction = async ({ request, params }) => {
  const userId = await requireUserId(request);

  const formData = new URLSearchParams(await request.text());

  const email = formData.get("email");
  if (!email) return;

  const friend = await getProfileByEmail(email);

  await addFriend({ userId }, friend?.id);
  return redirect("/notes/friends");
}