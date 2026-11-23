import { EGG_PRICE_PER_PIECE, GUEST_RATE_PER_MEAL } from "./mealBoard";

export interface MealRateBreakdown {
  /** Rana Bai's eggs, billed separately at ৳13 per piece. */
  ranaEggCost: number;
  /** Rasel's guest meals, billed separately at ৳70 per meal. */
  raselGuestCost: number;
  /** The part of the full bazar expense shared by regular members. */
  regularMealCost: number;
  /** Regular members' meals; egg-only and guest members are excluded. */
  regularMeals: number;
  /** Cost per regular meal, or 0 when there are no regular meals. */
  mealRate: number;
}

/**
 * Regular members split only their own meal cost. Egg-only and guest members
 * are charged separately and are excluded from the regular meal count, but
 * all three charges still add up to the full (actual) bazar expense.
 */
export function calculateMealRate(
  totalBazar: number,
  totalRanaEggs: number,
  totalRaselGuestMeals: number,
  regularMembersTotalMeals: number
): MealRateBreakdown {
  const ranaEggCost = totalRanaEggs * EGG_PRICE_PER_PIECE;
  const raselGuestCost = totalRaselGuestMeals * GUEST_RATE_PER_MEAL;

  // Guard against a bazar smaller than the separately billed consumption.
  const regularMealCost = Math.max(
    0,
    totalBazar - ranaEggCost - raselGuestCost
  );

  // Guard against division by zero when no regular meals were recorded.
  const mealRate =
    regularMembersTotalMeals > 0
      ? regularMealCost / regularMembersTotalMeals
      : 0;

  return {
    ranaEggCost,
    raselGuestCost,
    regularMealCost,
    regularMeals: regularMembersTotalMeals,
    mealRate,
  };
}
