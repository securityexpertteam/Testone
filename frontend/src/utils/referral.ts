const REFERRAL_STORAGE_KEY = 'apw_refid';
const DEFAULT_REFERRAL_ID = 'subhash';
const REFERRAL_IDS = ['subhash', 'srini', 'kumar'] as const;

export type ReferralId = typeof REFERRAL_IDS[number];

const isReferralId = (value: string): value is ReferralId =>
  REFERRAL_IDS.some((referralId) => referralId === value);

export function getReferralId(): ReferralId {
  const requestedReferralId = new URLSearchParams(window.location.search)
    .get('refid')
    ?.trim()
    .toLowerCase();
  const referralId = requestedReferralId && isReferralId(requestedReferralId)
    ? requestedReferralId
    : DEFAULT_REFERRAL_ID;

  window.localStorage.setItem(REFERRAL_STORAGE_KEY, referralId);
  return referralId;
}
