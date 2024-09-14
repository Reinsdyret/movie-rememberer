import type { User } from "./user.server";
import { supabase } from "./user.server";

export type Rating = {
  user_id: string;
  movie_id: string;
  rating: number;
  comment?: string;
}

export async function getRating({
  userId,
}: { userId: User["id"] }, movieId: string) {
  const { data, error } = await supabase
    .from("ratings")
    .select("*")
    .eq("user_id", userId)
    .eq("movie_id", movieId)
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

export async function createRating({
  userId,
  movie_id,
  rating,
  comment,
}: Pick<Rating, "movie_id" | "rating" | "comment"> & { userId: User["id"] }) {
  const { data, error } = await supabase
    .from("ratings")
    .insert({user_id: userId, movie_id: movie_id, rating: rating, comment: comment})
    .select("*")
    .single()

  if (!error) {
    return data;
  }

  return null;
}

export async function deleteRating({
  userId,
  movie_id
}: Pick<Rating, "movie_id"> & { userId: User["id"] }) {
  const { error } = await supabase
    .from("ratings")
    .delete()
    .match({ user_id: userId, movie_id: movie_id });

  if (!error) {
    return {};
  }

  return null;
}

