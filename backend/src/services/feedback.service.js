/**
 * Calculate analytics from feedback submissions
 * @param {Array} feedbacks - array of feedback documents
 * @returns {Object} analytics object
 */
const calculateAnalytics = (feedbacks) => {
  if (!feedbacks.length) {
    return {
      total_submissions:   0,
      overall_average:     0,
      per_question:        [],
      rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      helped_in_summary:   {},
      recommend_summary:   {},
      liked_most:          [],
      suggestions:         [],
      additional_comments: [],
    };
  }

  // ── Overall average ───────────────────────────────────────────
  const overallAvg =
    feedbacks.reduce((sum, f) => sum + (f.overall_rating || 0), 0) /
    feedbacks.length;

  // ── Per question average ──────────────────────────────────────
  const questionMap = {};
  feedbacks.forEach((f) => {
    (f.ratings || []).forEach(({ question, score }) => {
      if (!questionMap[question]) questionMap[question] = { total: 0, count: 0 };
      questionMap[question].total += score;
      questionMap[question].count += 1;
    });
  });

  const per_question = Object.entries(questionMap).map(([question, data]) => ({
    question,
    average:         parseFloat((data.total / data.count).toFixed(2)),
    total_responses: data.count
  }));

  // ── Rating distribution ───────────────────────────────────────
  const rating_distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  feedbacks.forEach((f) => {
    const r = Math.round(f.overall_rating);
    if (r >= 1 && r <= 5) rating_distribution[r]++;
  });

  // ── Helped in summary (checkbox counts) ──────────────────────
  const helped_in_summary = {};
  feedbacks.forEach((f) => {
    (f.helped_in || []).forEach((option) => {
      helped_in_summary[option] = (helped_in_summary[option] || 0) + 1;
    });
  });

  // ── Recommend summary ─────────────────────────────────────────
  const recommend_summary = {};
  feedbacks.forEach((f) => {
    if (f.recommend) {
      recommend_summary[f.recommend] = (recommend_summary[f.recommend] || 0) + 1;
    }
  });

  // ── Open-ended responses ──────────────────────────────────────
  const liked_most = feedbacks
    .filter((f) => f.liked_most && f.liked_most.trim())
    .map((f) => f.liked_most.trim());

  const suggestions = feedbacks
    .filter((f) => f.suggestions && f.suggestions.trim())
    .map((f) => f.suggestions.trim());

  const additional_comments = feedbacks
    .filter((f) => f.additional_comments && f.additional_comments.trim())
    .map((f) => f.additional_comments.trim());

  return {
    total_submissions:   feedbacks.length,
    overall_average:     parseFloat(overallAvg.toFixed(2)),
    per_question,
    rating_distribution,
    helped_in_summary,
    recommend_summary,
    liked_most,
    suggestions,
    additional_comments,
  };
};

module.exports = { calculateAnalytics };