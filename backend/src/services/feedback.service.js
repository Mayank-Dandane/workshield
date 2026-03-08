const Feedback = require('../models/Feedback');

/**
 * Calculate analytics from feedback submissions
 * @param {Array} feedbacks - array of feedback documents
 * @returns {Object} analytics object
 */
const calculateAnalytics = (feedbacks) => {
  if (!feedbacks.length) {
    return {
      total_submissions: 0,
      overall_average: 0,
      per_question: [],
      rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
  }

  // Overall average rating
  const overallAvg =
    feedbacks.reduce((sum, f) => sum + (f.overall_rating || 0), 0) /
    feedbacks.length;

  // Per question average
  const questionMap = {};
  feedbacks.forEach((f) => {
    f.ratings.forEach(({ question, score }) => {
      if (!questionMap[question]) {
        questionMap[question] = { total: 0, count: 0 };
      }
      questionMap[question].total += score;
      questionMap[question].count += 1;
    });
  });

  const per_question = Object.entries(questionMap).map(([question, data]) => ({
    question,
    average: parseFloat((data.total / data.count).toFixed(2)),
    total_responses: data.count
  }));

  // Rating distribution (how many gave 1, 2, 3, 4, 5)
  const rating_distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  feedbacks.forEach((f) => {
    const r = Math.round(f.overall_rating);
    if (r >= 1 && r <= 5) rating_distribution[r]++;
  });

  // Collect all comments and suggestions
  const comments = feedbacks
    .filter((f) => f.comments && f.comments.trim())
    .map((f) => f.comments.trim());

  const suggestions = feedbacks
    .filter((f) => f.suggestions && f.suggestions.trim())
    .map((f) => f.suggestions.trim());

  return {
    total_submissions: feedbacks.length,
    overall_average: parseFloat(overallAvg.toFixed(2)),
    per_question,
    rating_distribution,
    comments,
    suggestions
  };
};

module.exports = { calculateAnalytics };