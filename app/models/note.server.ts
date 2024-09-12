import type { User } from "./user.server";
import { supabase } from "./user.server";

export type Note = {
  id: string;
  title: string;
  body: string;
  url?: string;
  profile_id: string;
};

export async function getNoteListItems({ userId }: { userId: User["id"] }) {
  const { data } = await supabase
    .from("notes")
    .select("id, title, url")
    .eq("profile_id", userId);

  return data;
}

export async function createNote({
  title,
  body,
  url,
  userId,
}: Pick<Note, "body" | "title" | "url" >  & { userId: User["id"] }) {
  const { data, error } = await supabase
    .from("notes")
    .insert({ title, body, url, profile_id: userId })
    .select("*")
    .single();

  if (!error) {
    return data;
  }

  return null;
}

export async function deleteNote({
  id,
  userId,
}: Pick<Note, "id"> & { userId: User["id"] }) {
  const { error } = await supabase
    .from("notes")
    .delete()
    .match({ id, profile_id: userId });

  if (!error) {
    return {};
  }

  return null;
}

export async function getNote({
  id,
  userId,
}: Pick<Note, "id"> & { userId: User["id"] }) {
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("profile_id", userId)
    .eq("id", id)
    .single();

  if (!error) {
    return {
      userId: data.profile_id,
      id: data.id,
      title: data.title,
      body: data.body,
      url: data.url,
    };
  }

  return null;
}
