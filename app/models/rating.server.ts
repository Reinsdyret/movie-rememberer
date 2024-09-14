import type { User } from "./user.server";
import { supabase } from "./user.server";

export type Rating = {
  id: string;
  movie_id: string;
  rating: number;
  comment: string;
}

export async function getRating({
  id,
  userId,
}: Pick<Rating, "id" > & { userId: User["id"] }) {
  const { data, error } = await supabase
    .from("ratings")
    .select("*")
    .eq("user_id", userId)
    .eq("movie_id", id)
    .single()

  if (!error) {
    return {
      id: data.id,
      movie_id: data.movie_id,
      rating: data.rating,
      comment: data.comment,
    }
  }

  return null;
}

