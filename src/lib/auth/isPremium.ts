interface IPremiumFields {
  subscriptionStatus: string | null;
  subscriptionPlanEnd: Date | null;
  giftedLifetime: boolean;
  giftedExpiresAt: Date | null;
}

export function isPremium(user: IPremiumFields): boolean {
  if (user.subscriptionStatus === "active") return true;

  if (
    user.subscriptionStatus === "canceled" &&
    user.subscriptionPlanEnd &&
    user.subscriptionPlanEnd.getTime() > Date.now()
  ) {
    return true;
  }

  if (user.giftedLifetime) return true;

  if (user.giftedExpiresAt && user.giftedExpiresAt.getTime() > Date.now()) {
    return true;
  }

  return false;
}
