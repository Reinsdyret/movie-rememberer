import { StringNullableChain } from "cypress/types/lodash";
import { supabase, User } from "./user.server";

export type Recommendation = {
    recommender: string;
    recommendee: string;
    movie_id: string;
    comment: string;
}

export type Recommendations = {
    recommendations: Recommendation[];
}

export async function getRecommendations({
    userId,
}: { userId: User["id"] }) {
    const { data, error } = await supabase
        .from("recommendations")
        .select("*")
        .eq("recommendee", userId);

    if (error) {
        throw new Error(error.message);
    }
    
    const recommendations = data.map((item) => ({
        recommender: item.recommender,
        recommendee: item.recommendee,
        movie_id: item.movie_id,
        comment: item.comment,
    }));

    return { recommendations };
}

export async function recommendMovie({
    recommender,
    recommendee,
    movie_id,
    comment,
}: Recommendation) {
    const { data, error } = await supabase
        .from("recommendations")
        .insert([{ recommender, recommendee, movie_id, comment }])
        .select("*")
        .single();

    if (error) {
        console.log("here");
        throw new Error(error.message);
        
    }

    return data;
}

export async function deleteRecommendation(
    recommender: string,
    recommendee: string,
    movie_id: string,
) {
    const { error } = await supabase
        .from("recommendations")
        .delete()
        .eq("recommender", recommender)
        .eq("recommendee", recommendee)
        .eq("movie_id", movie_id);

    if (error) {
        throw new Error(error.message);
    }

    return true;
}