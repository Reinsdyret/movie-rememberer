import type { User } from "./user.server";
import { getProfileById, supabase } from "./user.server";

export type Friends = {
  friends: [string];
}

export async function getFriends({
  userId,
}: { userId: User["id"] }) {
  // Fetch rows where userId is either in profile1_id or profile2_id
  const { data, error } = await supabase
    .from("friends")
    .select("*")
    .or(`profile1_id.eq.${userId}, profile2_id.eq.${userId}`);

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Map over the data to get friend IDs and fetch their emails concurrently
  const friendEmails = await Promise.all(
    data.map(async (item) => {
      // Determine the friend's ID
      const friendId =
        item.profile1_id === userId ? item.profile2_id : item.profile1_id;

      // Fetch the friend's email
      const email = await getFriendMail(friendId);
      return email;
    })
  );

  // Filter out any null emails and return the list
  return { friends: friendEmails.filter((email): email is string => email !== null) };
}

export async function addFriend({
  userId,
}: { userId: User["id"] }, friendId: string) {
  const { data, error } = await supabase
    .from("friends")
    .insert({ profile1_id: userId, profile2_id: friendId })
    .select("*")
    .single()

  if (!error) {
    return data;
  }

  return null;
}

async function getFriendMail(userId: string) {
  const user = await getProfileById(userId);

  if (user) return user.email;

  return null;
}