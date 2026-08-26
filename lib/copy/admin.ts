/**
 * Internal tooling labels. Deliberately NOT in site_copy: that table exists so
 * public language stays editable, and flooding it with admin chrome would bury
 * the strings that actually matter.
 */
export const admin = {
  brand: 'MJ COBE CONTROL',
  signIn: 'SIGN IN',
  signOut: 'SIGN OUT',
  email: 'EMAIL',
  password: 'PASSWORD',
  authFailed: 'Those credentials were not accepted.',

  nav: {
    overview: 'OVERVIEW',
    contributions: 'CONTRIBUTIONS',
    sponsors: 'SPONSORS',
    offline: 'OFFLINE',
    settings: 'SETTINGS',
    copy: 'COPY',
    audit: 'AUDIT',
  },

  overview: {
    totalRaised: 'TOTAL RAISED',
    today: 'TODAY',
    week: 'THIS WEEK',
    month: 'THIS MONTH',
    supporters: 'SUPPORTERS',
    sponsors: 'SPONSORS',
    topSong: 'TOP RECORD',
    pendingReview: 'AWAITING REVIEW',
    recent: 'RECENT TRANSACTIONS',
    none: 'Nothing yet.',
  },

  table: {
    date: 'DATE',
    name: 'NAME',
    amount: 'AMOUNT',
    net: 'NET',
    song: 'RECORD',
    type: 'TYPE',
    state: 'STATE',
    moderation: 'MODERATION',
    actions: 'ACTIONS',
    business: 'BUSINESS',
    key: 'KEY',
    value: 'VALUE',
    entity: 'ENTITY',
    action: 'ACTION',
    admin: 'ADMIN',
    reason: 'REASON',
  },

  actions: {
    approve: 'APPROVE',
    hide: 'HIDE',
    unhide: 'SHOW',
    flag: 'FLAG',
    block: 'BLOCK',
    rename: 'RENAME',
    refund: 'REFUND',
    decline: 'DECLINE + REFUND',
    save: 'SAVE',
    add: 'ADD',
    filter: 'FILTER',
    all: 'ALL',
  },

  refund: {
    heading: 'REFUND',
    amount: 'AMOUNT TO REFUND',
    fullHint: 'Leave blank to refund the full remaining balance.',
    reason: 'REASON',
    note: 'NOTE',
    reasons: {
      unverified_sponsor: 'Unverified sponsor',
      fraud_risk: 'Fraud risk',
      brand_safety: 'Brand safety',
      duplicate_payment: 'Duplicate payment',
      customer_request: 'Customer request',
      other: 'Other',
    },
  },

  sponsors: {
    heading: 'SPONSOR REVIEW',
    pending: 'AWAITING APPROVAL',
    approved: 'APPROVED',
    empty: 'No sponsorships are waiting.',
    approveHint:
      'Approving settles the payment and puts this business on the leaderboard.',
    declineHint: 'Declining refunds in full and leaves nothing public.',
  },

  offline: {
    heading: 'ADD OFFLINE CONTRIBUTION',
    hint: 'For cash, check or wire that never touched a card processor.',
    campaign: 'CAMPAIGN',
    supportType: 'TYPE',
    businessName: 'BUSINESS NAME',
    displayName: 'DISPLAY NAME',
    contactEmail: 'CONTACT EMAIL',
    amount: 'AMOUNT',
    method: 'METHOD',
    leaderboardEligible: 'Eligible for the leaderboard',
    submit: 'RECORD CONTRIBUTION',
    recorded: 'Recorded.',
    methods: {
      cash: 'Cash',
      check: 'Check',
      wire: 'Wire',
      other: 'Other',
    },
  },

  settings: {
    heading: 'SETTINGS',
    hint:
      'Values stored here override the file defaults. Delete a value to fall back.',
    newKey: 'NEW KEY',
    newValue: 'VALUE (JSON)',
    invalidJson: 'That value is not valid JSON.',
  },

  copy: {
    heading: 'SITE COPY',
    hint:
      'Every public string. Blank fields fall back to the shipped default shown beneath.',
    fallback: 'DEFAULT',
  },

  audit: {
    heading: 'AUDIT LOG',
    hint: 'Append-only. Nothing here can be edited or deleted.',
  },

  saved: 'SAVED',
  failed: 'FAILED',
} as const;
