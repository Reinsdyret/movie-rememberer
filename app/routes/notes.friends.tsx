import { ActionFunction, json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Form, useFetcher, useLoaderData } from "@remix-run/react";
import { useEffect, useRef } from "react";
import invariant from "tiny-invariant";
import { addFriend, Friends, getFriends, getFriendRequests, acceptFriendRequest, rejectFriendRequest } from "~/models/friends.server"
import { getProfileByEmail } from "~/models/user.server";
import { requireUserId } from "~/session.server";

type LoaderData = {
  friends: Friends;
  friendRequests: FriendRequest[];
}

type FriendRequest = {
  id: string;
  name: string;
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);

  const friends = await getFriends({ userId });
  const friendRequests = await getFriendRequests({ userId });

  if (!friends) {
    throw new Response("Response not found", { status: 404 });
  }

  return json({ friends, friendRequests });
}

export const action: ActionFunction = async ({ request, params }) => {
  const userId = await requireUserId(request);
  const formData = await request.formData();

  const email = formData.get("email") as string | undefined;
  const requestId = formData.get("requestId") as string | undefined;
  const action = formData.get("action") as string | undefined;

  if (email) {
    const friend = await getProfileByEmail(email);
    await addFriend({ userId }, friend?.id);
  } else if (requestId && action) {
    if (action === "accept") {
      await acceptFriendRequest({ userId, requestId: requestId.toString() });
    } else if (action === "reject") {
      await rejectFriendRequest({ userId, requestId: requestId.toString() });
    }
  }

  return redirect("/notes/friends");
}

export default function FriendsPage() {
  const { friends, friendRequests } = useLoaderData<typeof loader>() as LoaderData;
  const fetcher = useFetcher();

  let formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    formRef.current?.reset();
  }, [fetcher.state, fetcher.data]);

  return (
    <div className="flex">
      <div className="w-1/2 pr-4">
        <h1 className="text-2xl font-bold">Friends</h1>
        <ul>
          {friends.friends ? (
            friends.friends.map((friend: string) => (
              <li key={friend}>{friend}</li>
            ))
          ) : (
            <li>No friends yet</li>
          )}
        </ul>
      </div>

      <div className="w-1/2 pl-4">
        <h2 className="text-xl font-bold">Friend Requests</h2>
        <ul>
          {friendRequests.length > 0 ? (
            friendRequests.map((request: FriendRequest) => (
              <li key={request.id} className="flex items-center mb-2">
                <span>{request.name}</span>
                <Form method="post" className="ml-2">
                  <input type="hidden" name="requestId" value={request.id} />
                  <button
                    type="submit"
                    name="action"
                    value="accept"
                    className="bg-green-500 text-white rounded-md p-2 mr-2"
                  >
                    ✓
                  </button>
                  <button
                    type="submit"
                    name="action"
                    value="reject"
                    className="bg-red-500 text-white rounded-md p-2"
                  >
                    ✗
                  </button>
                </Form>
              </li>
            ))
          ) : (
            <li>No friend requests</li>
          )}
        </ul>
      </div>

      <div className="w-full mt-8">
        <h2 className="text-xl font-bold">Add Friend</h2>
        <Form method="post" ref={formRef}>
          <input type="email" name="email" placeholder="Email" className="border border-gray-300 rounded-md p-2" />
          <button type="submit" className="bg-blue-500 text-white rounded-md p-2 ml-2">Add</button>
        </Form>
      </div>
    </div>
  )
}