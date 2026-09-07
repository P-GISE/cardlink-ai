import { badRequest } from "../utils/httpErrors.js";

const toRun = (row) => ({
  id: row.id,
  profileId: row.profile_id,
  source: row.source,
  createdAt: row.created_at
});

const toRecommendation = (row) => ({
  id: row.id,
  runId: row.run_id,
  targetProfileId: row.target_profile_id,
  recommendedProfileId: row.recommended_profile_id,
  score: row.score,
  reason: row.reason,
  createdAt: row.created_at
});

const getCallerProfile = async (supabase, user) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, user_id, display_name, role, location")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw badRequest("Create your profile before creating recommendations.");

  return data;
};

const scoreCandidate = (profile, candidate) => {
  let score = 70;
  const reasons = [];

  if (profile.role && candidate.role && profile.role === candidate.role) {
    score += 10;
    reasons.push("same role");
  }

  if (profile.location && candidate.location && profile.location === candidate.location) {
    score += 10;
    reasons.push("same location");
  }

  return {
    candidate,
    score,
    reason: reasons.length > 0 ? reasons.join(", ") : "published profile match"
  };
};

export const createRecommendationService = (supabase) => ({
  async createRun(user) {
    const profile = await getCallerProfile(supabase, user);

    const { data: candidates, error: candidatesError } = await supabase
      .from("profiles")
      .select("id, slug, display_name, role, headline, location, is_published")
      .eq("is_published", true)
      .neq("id", profile.id)
      .order("updated_at", { ascending: false })
      .limit(5);

    if (candidatesError) throw candidatesError;

    const rankedCandidates = candidates
      .map((candidate) => scoreCandidate(profile, candidate))
      .sort((left, right) => right.score - left.score);

    const { data: run, error: runError } = await supabase
      .from("recommendation_runs")
      .insert({ profile_id: profile.id, source: "db_rules" })
      .select("id, profile_id, source, created_at")
      .single();

    if (runError) throw runError;

    if (rankedCandidates.length === 0) {
      return {
        run: toRun(run),
        recommendations: []
      };
    }

    const rows = rankedCandidates.map(({ candidate, score, reason }) => ({
      run_id: run.id,
      target_profile_id: profile.id,
      recommended_profile_id: candidate.id,
      score,
      reason
    }));

    const { data: recommendations, error: recommendationsError } = await supabase
      .from("recommendations")
      .insert(rows)
      .select("id, run_id, target_profile_id, recommended_profile_id, score, reason, created_at");

    if (recommendationsError) throw recommendationsError;

    return {
      run: toRun(run),
      recommendations: recommendations.map(toRecommendation)
    };
  }
});
