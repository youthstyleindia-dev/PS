import { MilestoneProgress, PlacementMilestone } from '../types/hub.types.js';

/**
 * Calculates placement readiness score R in [0, 100].
 * - Milestones progress: 50%
 * - Skills breadth: 30% (target >= 6 skills)
 * - Profile completeness: 20% (role +8, goals +6, resume +6)
 */
export function calculateReadinessScore(params: {
  totalMilestones: number;
  completedMilestones: number;
  skills: string[] | any[];
  targetRole?: string;
  placementGoals?: string;
  resumeUrl?: string;
}): number {
  const { totalMilestones, completedMilestones, skills, targetRole, placementGoals, resumeUrl } = params;

  // 1. Milestone Score (50%)
  const milestoneScore = totalMilestones > 0
    ? (completedMilestones / totalMilestones) * 50
    : 0;

  // 2. Skills Portfolio Depth (30% - scaled to max 6 skills)
  const validSkills = (skills || []).filter(s => {
    if (!s) return false;
    if (typeof s === 'string') return s.trim().length > 0;
    if (typeof s === 'object' && s.name) return String(s.name).trim().length > 0;
    return false;
  });
  const skillsScore = Math.min(1.0, validSkills.length / 6) * 30;

  // 3. Profile Completeness (20%)
  let profileScore = 0;
  if (targetRole && targetRole.trim().length > 0) profileScore += 8;
  if (placementGoals && placementGoals.trim().length >= 10) profileScore += 6;
  if (resumeUrl && resumeUrl.trim().length > 0) profileScore += 6;

  const total = Math.round(milestoneScore + skillsScore + profileScore);
  return Math.max(0, Math.min(100, total));
}

/**
 * Calculates detailed category-wise and overall progress metrics
 */
export function calculateMilestoneProgress(milestones: PlacementMilestone[]): MilestoneProgress {
  const totalMilestones = milestones.length;
  const completedMilestones = milestones.filter(m => m.status === 'completed').length;
  const inProgressMilestones = milestones.filter(m => m.status === 'in_progress').length;
  const progressPercentage = totalMilestones > 0
    ? Math.round((completedMilestones / totalMilestones) * 100)
    : 0;

  const categories = Array.from(new Set(milestones.map(m => m.category)));

  const byCategory = categories.map(cat => {
    const catMilestones = milestones.filter(m => m.category === cat);
    const catTotal = catMilestones.length;
    const catCompleted = catMilestones.filter(m => m.status === 'completed').length;
    const catPercentage = catTotal > 0 ? Math.round((catCompleted / catTotal) * 100) : 0;
    return {
      category: cat,
      total: catTotal,
      completed: catCompleted,
      percentage: catPercentage
    };
  });

  return {
    totalMilestones,
    completedMilestones,
    inProgressMilestones,
    progressPercentage,
    byCategory
  };
}

/**
 * Calculates dynamic rating average with 1 decimal precision
 */
export function calculateNewRatingAverage(
  currentRating: number,
  currentCount: number,
  newRating: number,
  previousUserRating?: number
): { newRatingAverage: number; newRatingCount: number } {
  let newTotalPoints: number;
  let newRatingCount: number;

  const currentTotal = currentRating * currentCount;

  if (previousUserRating !== undefined && previousUserRating !== null) {
    // User updating existing rating
    newTotalPoints = currentTotal - previousUserRating + newRating;
    newRatingCount = currentCount;
  } else {
    // Brand new rating from this user
    newTotalPoints = currentTotal + newRating;
    newRatingCount = currentCount + 1;
  }

  const rawAverage = newRatingCount > 0 ? newTotalPoints / newRatingCount : 0;
  const newRatingAverage = Math.round(rawAverage * 10) / 10;

  return { newRatingAverage, newRatingCount };
}
