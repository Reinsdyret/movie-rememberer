import { LoaderFunction, ActionFunction, redirect } from "@remix-run/node";
import { json, useLoaderData, Form } from "@remix-run/react";
import { getNote, createNote } from "~/models/note.server";
import { deleteRecommendation, getRecommendations, Recommendations } from "~/models/recommendation.server";
import { getProfileById } from "~/models/user.server";
import { requireUserId } from "~/session.server";

type LoaderData = {
    recommendations: Recommendation[];
}

type Recommendation = {
    recommender: string;
    recommenderMail: string;
    movieId: string;
    movieTitle: string;
    comment: string;
}

export const loader: LoaderFunction = async ({ request }) => {
    const userId = await requireUserId(request);
    const recommendations = await getRecommendations({ userId });
    const recommendationsData: Recommendation[] = [];

    for (const recommendation of recommendations.recommendations) {
        const recommenderMail = await getProfileById(recommendation.recommender);
        const note = await getNote({ id: recommendation.movie_id, userId: recommendation.recommender });

        if (!recommenderMail || !note) {
            continue;
        }

        recommendationsData.push({
            recommender: recommendation.recommender,
            recommenderMail: recommenderMail.email,
            movieTitle: note.title,
            movieId: recommendation.movie_id,
            comment: recommendation.comment
        });
    }
    
    return { recommendations: recommendationsData };
}

export const action: ActionFunction = async ({ request }) => {
    const userId = await requireUserId(request);
    const formData = await request.formData();
    const action = formData.get("action");
    const recommender = formData.get("recommender");
    const movieId = formData.get("movieId");

    if (action === "addNote") {
        const movieTitle = formData.get("movieTitle");
        const comment = formData.get("comment");

        if (typeof recommender !== "string" || typeof movieId !== "string" || typeof movieTitle !== "string" || typeof comment !== "string") {
            return json({ error: "Invalid form data" }, { status: 400 });
        }

        await createNote({ title: movieTitle, body: comment, userId });
    }

    if (typeof recommender !== "string" || typeof movieId !== "string") {
        return json({ error: "Invalid form data" }, { status: 400 });
    }

    await deleteRecommendation(recommender, userId, movieId);
    
    return null;
};

export default function RecommendationsPage() {
    const { recommendations } = useLoaderData<LoaderData>();
    
    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Recommendations</h1>
            <ul className="space-y-6">
                {recommendations.map((recommendation) => (
                    <li key={recommendation.movieTitle} className="bg-white shadow-md rounded-lg p-4 flex justify-between items-start">
                        <div className="flex-grow">
                            <h2 className="text-xl font-semibold text-blue-600 mb-2">{recommendation.movieTitle}</h2>
                            <p className="text-sm text-gray-600 mb-2">
                                Recommended by: <span className="font-medium">{recommendation.recommenderMail}</span>
                            </p>
                            <p className="text-gray-800 italic">"{recommendation.comment}"</p>
                        </div>
                        <div className="flex space-x-2">
                            <Form method="post">
                                <input type="hidden" name="action" value="addNote" />
                                <input type="hidden" name="recommender" value={recommendation.recommender} />
                                <input type="hidden" name="movieId" value={recommendation.movieId} />
                                <input type="hidden" name="movieTitle" value={recommendation.movieTitle} />
                                <input type="hidden" name="comment" value={recommendation.comment} />
                                <button 
                                    type="submit"
                                    className="bg-green-500 hover:bg-green-600 text-white rounded-full w-10 h-10 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-50 transition-colors duration-200"
                                    aria-label="Add note"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                </button>
                            </Form>

                            <Form method="post">
                                <input type="hidden" name="action" value="deleteRecommendation" />
                                <input type="hidden" name="recommender" value={recommendation.recommender} />
                                <input type="hidden" name="movieId" value={recommendation.movieId} />
                                <button 
                                    type="submit"
                                    className="bg-red-500 hover:bg-red-600 text-white rounded-full w-10 h-10 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50 transition-colors duration-200"
                                    aria-label="Delete recommendation"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </Form>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}