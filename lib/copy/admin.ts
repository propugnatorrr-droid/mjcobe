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
    songs: 'SONG MANAGEMENT',
    campaigns: 'CAMPAIGN CONTROL',
    media: 'MEDIA LIBRARY',
    journey: 'JOURNEY',
    contributions: 'CONTRIBUTIONS',
    sponsors: 'SPONSORS',
    offline: 'OFFLINE',
    settings: 'SETTINGS',
    copy: 'COPY',
    audit: 'AUDIT',
    blocklist: 'BLOCKLIST',
    referrals: 'REFERRAL LINKS',
    sponsorProfiles: 'PARTNER PROFILES',
    notifications: 'EMAIL DELIVERY',
    analytics: 'ANALYTICS',
    flags: 'FEATURE FLAGS',
    feed: 'BRAND FEED',
    events: 'EVENTS',
    orders: 'ORDERS',
    checkIn: 'CHECK-IN',
    shop: 'SHOP',
  },

  analytics: {
    heading:
      'CAMPAIGN ANALYTICS',
    hint:
      'First-party campaign activity. Revenue and conversions are derived from settled ledger balances, never browser redirects.',
    campaign:
      'CAMPAIGN',
    views:
      'VIEWS',
    listeners:
      'LISTENERS',
    completions:
      'COMPLETIONS',
    supportClicks:
      'FAN CLICKS',
    sponsorClicks:
      'SPONSOR CLICKS',
    checkoutStarts:
      'CHECKOUTS',
    failures:
      'FAILURES',
    conversions:
      'SETTLED',
    conversionRate:
      'CONVERSION',
    revenue:
      'REVENUE',
    empty:
      'No campaign analytics have been recorded yet.',
  },

  media: {

    heading: 'MEDIA LIBRARY',
    hint:
      'Review every uploaded image and audio file. Existing files can be assigned from each song management page without uploading duplicates.',
    empty:
      'No media files have been uploaded.',
    chooseExisting:
      'CHOOSE FROM MEDIA LIBRARY',
    selectAsset:
      'Select an existing file',
    noneForType:
      'No matching files are available.',
    assignCover:
      'ASSIGN COVER',
    assignAudio:
      'ASSIGN AUDIO',
    openFile:
      'OPEN FILE',
    fileSize:
      'FILE SIZE',
    duration:
      'DURATION',
    dimensions:
      'DIMENSIONS',
    uploaded:
      'UPLOADED',
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
    trend: 'CONTRIBUTIONS — LAST 14 DAYS',
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
    edit: 'EDIT',
    add: 'ADD',
    filter: 'FILTER',
    all: 'ALL',
    view: 'VIEW',
manage: 'MANAGE',
preview: 'PUBLIC PREVIEW',
delete: 'DELETE',
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
      'Review the business, destination links, logo and campaign amount before settlement. Approval captures the payment and places the business on the public leaderboard.',
    declineHint:
      'Declining cancels an uncaptured payment or refunds the remaining settled balance.',
    logo: 'LOGO PREVIEW',
    contact: 'REPRESENTATIVE',
    phone: 'PHONE',
    website: 'WEBSITE',
    instagram: 'INSTAGRAM',
    industry: 'INDUSTRY',
    message: 'SPONSOR MESSAGE',
    paymentState: 'PAYMENT STATE',
    review: 'REVIEW SUBMISSION',
    declineReason: 'DECLINE REASON',
    noLogo: 'NO LOGO SUBMITTED',
    directory: 'PARTNER PROFILES',
directoryHint:
  'Manage approved, pending, hidden and blocked business profiles. Public profiles only appear while approved.',
profile: 'PARTNER PROFILE',
profileHint:
  'Edit the public brand information shown on the partner profile.',
businessName: 'BUSINESS NAME',
description: 'PUBLIC DESCRIPTION',
shopUrl: 'SHOP URL',
publicStatus: 'PUBLIC STATUS',
contributions: 'CONTRIBUTIONS',
totalBacked: 'TOTAL BACKED',
created: 'CREATED',
editProfile: 'EDIT PROFILE',
saveProfile: 'SAVE PROFILE',
hideProfile: 'HIDE PUBLIC PROFILE',
showProfile: 'RESTORE PUBLIC PROFILE',
noSponsors: 'No sponsor profiles have been created.',
    approvedLogo: 'CURRENT PUBLIC LOGO',
pendingLogo: 'PENDING LOGO',
pendingLogoHint:
  'The current public logo remains visible until this replacement is approved.',
uploadLogo: 'UPLOAD REPLACEMENT',
chooseLogo: 'CHOOSE PNG OR WEBP',
approveLogo: 'APPROVE LOGO',
rejectLogo: 'REJECT LOGO',
logoRequirements:
  'PNG or WebP, maximum 2 MB. Files are checked by content, not only filename.',
contracts:
  'SPONSOR CONTRACTS',
contractsHint:
  'Track contract documents and signing status. Contract documents are never shown on public sponsor pages.',
contractsEmpty:
  'No contracts have been recorded for this sponsor.',
newContract:
  'ADD CONTRACT',
contractCampaign:
  'CAMPAIGN',
contractNoCampaign:
  'General sponsor contract',
contractDocument:
  'SECURE DOCUMENT LOCATION',
contractDocumentHint:
  'Enter an HTTPS link from your private document provider or a protected same-site path. Do not use a public Blob URL for confidential contracts.',
contractSignedAt:
  'SIGNED DATE AND TIME — UTC',
contractSignedHint:
  'Leave blank while the contract is unsigned.',
createContract:
  'CREATE CONTRACT',
saveContract:
  'SAVE CONTRACT',
openContract:
  'OPEN CONTRACT',
contractSigned:
  'SIGNED',
contractUnsigned:
  'UNSIGNED',
contractCreated:
  'CREATED',
contractInvalid:
  'CHECK THE CONTRACT FIELDS',
invoices:
  'SPONSOR INVOICES',
invoicesHint:
  'Track invoices and payment status. Invoice records are private and do not change contribution or ledger totals.',
invoicesEmpty:
  'No invoices have been recorded for this sponsor.',
newInvoice:
  'ADD INVOICE',
invoiceNumber:
  'INVOICE NUMBER',
invoiceAmount:
  'AMOUNT',
invoiceContribution:
  'RELATED CONTRIBUTION',
invoiceNoContribution:
  'No related contribution',
invoiceStatus:
  'STATUS',
invoiceDocument:
  'SECURE INVOICE LOCATION',
invoiceDocumentHint:
  'Enter an HTTPS link from your private document provider or a protected same-site path.',
invoiceIssuedAt:
  'ISSUED DATE AND TIME — UTC',
invoiceIssuedHint:
  'Issued and paid invoices require an issued date.',
createInvoice:
  'CREATE INVOICE',
saveInvoice:
  'SAVE INVOICE',
openInvoice:
  'OPEN INVOICE',
invoiceCreated:
  'CREATED',
invoiceInvalid:
  'CHECK THE INVOICE FIELDS',
invoiceDuplicate:
  'THAT INVOICE NUMBER IS ALREADY IN USE',
invoiceStatuses: {
  draft: 'DRAFT',
  issued: 'ISSUED',
  paid: 'PAID',
  void: 'VOID',
},
  },


  songs: {
    heading: 'SONG MANAGEMENT',
    hint: 'Every song and its campaigns. Create, edit, and launch from here — no deploy required.',
    createHeading: 'CREATE SONG',
    editHeading: 'EDIT SONG',
    empty: 'No songs yet.',
    title: 'TITLE',
    slug: 'SLUG',
    status: 'STATUS',
    description: 'DESCRIPTION',
    spotifyUrl: 'SPOTIFY URL',
    appleMusicUrl: 'APPLE MUSIC URL',
    youtubeUrl: 'YOUTUBE URL',
    musicVideoUrl: 'MUSIC VIDEO URL',
    published: 'Published (visible on the public site)',
    media: 'SONG MEDIA',
    mediaHint:
      'Upload the permanent cover artwork and playable audio source for this record.',
    coverArt: 'COVER ART',
    audioPreview: 'AUDIO',
    noMedia: 'No file assigned.',
    uploadMedia: 'UPLOAD + ASSIGN',
    replaceMedia: 'REPLACE FILE',
    uploading: 'UPLOADING',
    uploadFailed:
      'The upload could not be completed. Check the file type, size and Blob configuration.',
    playbackSettings: 'PLAYBACK SETTINGS',
    previewStart: 'PREVIEW START — SECONDS',
    previewEnd: 'PREVIEW END — SECONDS',
    fullPlayback:
      'Allow the entire audio file to play publicly',
    savePlayback:
      'SAVE PLAYBACK SETTINGS',
    previewTooLong:
      'Preview windows may not exceed 60 seconds unless full playback is enabled.',
    create: 'CREATE SONG',
    save: 'SAVE SONG',
    campaigns: 'CAMPAIGNS',
    campaignsEmpty: 'No campaigns for this song yet.',
    newCampaign: 'NEW CAMPAIGN',
    campaignName: 'NAME',
    campaignKind: 'KIND',
    campaignGoal: 'GOAL',
    campaignObjective: 'OBJECTIVE',
    campaignStatus: 'STATUS',
    campaignStartsAt:
      'CAMPAIGN START — UTC',
    campaignEndsAt:
      'CAMPAIGN END — UTC',
    campaignTimeHint:
      'Leave either date blank when no automatic start or end is required. End must be after start.',
    acceptSupport:
      'Accept new support',
    campaignControls:
      'CAMPAIGN CONTROLS',
    launchCampaign:
      'LAUNCH CAMPAIGN',
    pauseCampaign:
      'PAUSE SUPPORT',
    resumeCampaign:
      'RESUME SUPPORT',
    closeCampaign:
      'CLOSE CAMPAIGN',
    campaignInvalid:
      'CHECK THE CAMPAIGN FIELDS AND DATES',
    fanSupport: 'Fan support enabled',
    businessSponsorship: 'Business sponsorship enabled',
    createCampaign: 'CREATE CAMPAIGN',
    saveCampaign: 'SAVE',
    supportTiers: 'SUPPORT TIERS',
    tiersEmpty: 'No support tiers have been created for this campaign.',
    newTier: 'ADD SUPPORT TIER',
    tierName: 'TIER NAME',
    tierPrice: 'PRICE',
    tierDescription: 'DESCRIPTION',
    tierBenefits: 'BENEFITS',
    benefitsHint: 'Enter one benefit per line.',
    tierBadge: 'BADGE',
    noBadge: 'No badge',
    quantityLimit: 'QUANTITY LIMIT',
    unlimited: 'Unlimited',
    startsAt: 'START DATE AND TIME',
    expiresAt: 'EXPIRATION DATE AND TIME',
    sortIndex: 'DISPLAY ORDER',
    tierActive: 'Tier is active',
    createTier: 'CREATE TIER',
    saveTier: 'SAVE TIER',
    activateTier: 'ACTIVATE TIER',
    deactivateTier: 'DEACTIVATE TIER',
    active: 'Active',
    inactive: 'Inactive',
    updates: 'CAMPAIGN UPDATES',
    updatesHint:
      'Create announcements, production notes and progress reports for this song.',
    updatesEmpty:
      'No campaign updates have been created.',
    newUpdate: 'CREATE UPDATE',
    updateTitle: 'UPDATE TITLE',
    updateBody: 'UPDATE BODY',
    updateCampaign: 'CAMPAIGN',
    noUpdateCampaign:
      'Song update — no specific campaign',
    updateMinimumTier:
      'MINIMUM SUPPORT AMOUNT',
    updateMinimumTierHint:
      'Leave blank for a public update.',
    updatePublishedAt:
      'PUBLICATION DATE AND TIME',
    updateTimeHint:
      'Times are entered and displayed in UTC.',
    updateVisible:
      'Visible on the public song page',
    createUpdate: 'CREATE UPDATE',
    saveUpdate: 'SAVE UPDATE',
    editUpdate: 'EDIT UPDATE',
    publishUpdate: 'PUBLISH NOW',
    unpublishUpdate:
      'RETURN TO DRAFT',
    showUpdate: 'SHOW UPDATE',
    hideUpdate: 'HIDE UPDATE',
    updateDraft: 'Draft',
    updateScheduled: 'Scheduled',
    updatePublished: 'Published',
    updatePublic: 'Public',
    updateGated: 'Supporter only',
    updateVisibleState: 'Visible',
    updateHiddenState: 'Hidden',
    sponsorPackages:
      'BUSINESS SPONSOR PACKAGES',
    sponsorPackagesHint:
      'Create fixed sponsorship choices and define exactly what each package includes.',
    sponsorPackagesEmpty:
      'No business sponsor packages have been created for this campaign.',
    newSponsorPackage:
      'ADD SPONSOR PACKAGE',
    sponsorPackageName:
      'PACKAGE NAME',
    sponsorPackagePrice:
      'PACKAGE PRICE',
    sponsorPackageSort:
      'DISPLAY ORDER',
    sponsorDeliverables:
      'DELIVERABLES',
    sponsorDeliverablesHint:
      'Enter one deliverable per line.',
    includesBrandedVisual:
      'Includes a branded visual',
    sponsorPackageActive:
      'Package is active',
    createSponsorPackage:
      'CREATE SPONSOR PACKAGE',
    saveSponsorPackage:
      'SAVE SPONSOR PACKAGE',
    activateSponsorPackage:
      'ACTIVATE PACKAGE',
    deactivateSponsorPackage:
      'DEACTIVATE PACKAGE',
    tierBadges: {
      supporter: 'Supporter',
      day_one: 'Day One',
      inner_circle: 'Inner Circle',
      gold: 'Gold Supporter',
      founding: 'Founding Supporter',
      executive: 'Executive Supporter',
    },
    statuses: {
      draft: 'Draft',
      building: 'Building',
      coming_soon: 'Coming Soon',
      released: 'Released',
      vault: 'Vault',
    },
    campaignStatuses: {
      draft: 'Draft',
      live: 'Live',
      funded: 'Funded',
      closed: 'Closed',
      archived: 'Archived',
    },
    campaignKinds: {
      release: 'Release',
      video: 'Video',
      remix: 'Remix',
      tour: 'Tour',
      other: 'Other',
    },
  },
  journey: {
    heading: 'JOURNEY MANAGEMENT',
    hint:
      'Create and manage the permanent timeline of previews, milestones, production updates, releases, supporters and sponsors.',
    createHeading: 'CREATE JOURNEY EVENT',
    eventsHeading: 'JOURNEY EVENTS',
    empty: 'No journey events have been created.',
    create: 'CREATE EVENT',
    save: 'SAVE EVENT',
    edit: 'EDIT EVENT',
    title: 'EVENT TITLE',
    body: 'DETAILS',
    kind: 'EVENT TYPE',
    song: 'SONG',
    campaign: 'CAMPAIGN',
    occurredAt: 'EVENT DATE AND TIME',
    timeHint: 'Times are entered and displayed in UTC.',
    image: 'IMAGE',
    visible: 'Visible on the public Journey page',
    noSong: 'Global event — no song',
    noCampaign: 'No campaign',
    noImage: 'No image',
    globalEvent: 'Global Journey',
    public: 'Public',
    hidden: 'Hidden',
    automatic: 'Automatic',
    kinds: {
      preview_uploaded: 'Preview uploaded',
      supporter_milestone: 'Supporter milestone',
      funding_milestone: 'Funding milestone',
      new_top_sponsor: 'New top sponsor',
      new_top_supporter: 'New top supporter',
      production_update: 'Production update',
      release: 'Song release',
      video_release: 'Video release',
      stream_milestone: 'Stream milestone',
      view_milestone: 'View milestone',
      campaign_opened: 'Campaign opened',
      campaign_closed: 'Campaign closed',
      manual: 'Manual event',
    },
  },


  referrals: {
    heading: 'REFERRAL LINKS',
    hint: 'Trackable promo links — mjcobe.com/r/CODE logs a real visit, then forwards to that campaign’s song page.',
    empty: 'No referral links yet.',
    code: 'CODE',
    campaign: 'CAMPAIGN',
    label: 'LABEL (OPTIONAL)',
    visits: 'VISITS',
    create: 'CREATE LINK',
    duplicate: 'That code is already in use.',
    url: 'URL',
        uniqueSessions:
      'UNIQUE VISITORS',
    conversions:
      'SETTLED SUPPORT',
    conversionRate:
      'CONVERSION',
    revenue:
      'SETTLED REVENUE',
    averageContribution:
      'AVERAGE SUPPORT',
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

  flags: {
    heading: 'FEATURE FLAGS',
    hint:
      'A flag with no row here is off by default. Creating a row with Enabled checked is what actually turns a feature on for visitors — nothing here goes live from code alone.',
    newKey: 'NEW FLAG KEY',
    description: 'DESCRIPTION',
    enabled: 'ENABLED',
    add: 'ADD',
    empty: 'No flags have been created yet.',
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

  blocklist: {
    heading: 'BLOCKLIST',
    hint: 'Domains, emails, names, categories or industries blocked from checkout entirely.',
    empty: 'Nothing is blocked.',
    kind: 'KIND',
    value: 'VALUE',
    note: 'NOTE (OPTIONAL)',
    add: 'ADD',
    remove: 'REMOVE',
    kinds: {
      domain: 'Domain',
      email: 'Email',
      name: 'Name',
      category: 'Category',
      industry: 'Industry',
    },
  },

  feed: {
    heading: 'BRAND FEED',
    hint: 'Every post starts pending. Nothing here is public until you approve it — and it stays private again the moment either the post or its sponsor stops being approved.',
    newPost: 'NEW POST',
    empty: 'No posts yet.',
    status: 'STATUS',
    sponsor: 'SPONSOR',
    title: 'TITLE',
    submitted: 'SUBMITTED',
    source: 'SOURCE',
    review: 'REVIEW',
    sponsorLabel: 'SPONSOR',
    postType: 'TYPE',
    titleField: 'TITLE',
    body: 'BODY',
    ctaLabel: 'BUTTON LABEL',
    ctaUrl: 'BUTTON LINK (HTTPS)',
    relatedSong: 'RELATED SONG (OPTIONAL)',
    relatedCampaign: 'RELATED CAMPAIGN (OPTIONAL)',
    rightsAttested: 'SUBMITTER ATTESTED THEY HAVE RIGHTS TO THIS CONTENT',
    unsafeUrl: 'That link is not a valid https:// address.',
    approve: 'APPROVE',
    reject: 'REJECT',
    hide: 'HIDE',
    unpublish: 'UNPUBLISH',
    schedule: 'SCHEDULE FOR',
    publishNow: 'PUBLISH IMMEDIATELY',
    rejectionReason: 'REASON (SHOWN IN AUDIT LOG ONLY)',
    sponsorContext: 'SPONSOR CONTEXT',
    sponsorBlocked: 'This sponsor is not currently approved — this post cannot be public regardless of its own status.',
    originalSubmission: 'ORIGINAL SUBMISSION (BEFORE EDITS)',
    media: 'IMAGE (OPTIONAL)',
    mediaHint: 'PNG, WebP, or JPEG, up to 5MB. Leave empty to keep the current image on an edit.',
    mediaCurrent: 'CURRENT IMAGE ON FILE',
    mediaTypeError: 'That file type is not supported. Use PNG, WebP, or JPEG.',
    mediaSizeError: 'That image is larger than 5MB.',
    mediaSignatureError: "That file's contents don't match its extension.",
    invites: {
      heading: 'SUBMISSION INVITES',
      hint: 'Each invite is bound to one approved sponsor and can be used once. The sponsor never chooses itself — you do, here.',
      issue: 'ISSUE INVITE',
      sponsorLabel: 'SPONSOR',
      expiresIn: 'EXPIRES IN (DAYS)',
      recipientEmail: 'SEND TO (EMAIL)',
      revoke: 'REVOKE',
      resend: 'RESEND',
      status: 'STATUS',
      statusPending: 'PENDING',
      statusUsed: 'USED',
      statusRevoked: 'REVOKED',
      statusExpired: 'EXPIRED',
      created: 'ISSUED',
      empty: 'No invites issued yet.',
      sponsorMustBeApproved: 'Only approved sponsors can receive a submission invite.',
    },
  },

  events: {
    heading: 'EVENTS',
    hint: 'No payments happen here yet — this is the event catalog and ticket-type pricing/capacity plan. Selling tickets lands in a later batch.',
    create: 'NEW EVENT',
    createHeading: 'NEW EVENT',
    empty: 'No events yet.',
    title: 'TITLE',
    slug: 'SLUG',
    venue: 'VENUE',
    startsAt: 'START (LOCAL VENUE TIME)',
    status: 'STATUS',
    published: 'PUBLISHED',
    description: 'DESCRIPTION',
    venueName: 'VENUE NAME',
    addressLine1: 'ADDRESS LINE 1',
    addressLine2: 'ADDRESS LINE 2 (OPTIONAL)',
    city: 'CITY',
    region: 'STATE / REGION',
    postalCode: 'POSTAL CODE',
    country: 'COUNTRY',
    endsAt: 'END (OPTIONAL)',
    timezone: 'TIMEZONE (IANA, E.G. AMERICA/NEW_YORK)',
    salesStartAt: 'TICKET SALES START (OPTIONAL)',
    salesEndAt: 'TICKET SALES END (OPTIONAL)',
    ticketingEnabled: 'TICKETING ENABLED FOR THIS EVENT',
    capacity: 'VENUE CAPACITY (OPTIONAL, INFORMATIONAL ONLY)',
    cancellationNote: 'CANCELLATION / POSTPONEMENT NOTE (SHOWN PUBLICLY WHEN SET)',
    isPublished: 'PUBLISHED (VISIBLE ON /EVENTS)',
    statuses: {
      scheduled: 'SCHEDULED',
      postponed: 'POSTPONED',
      canceled: 'CANCELED',
      completed: 'COMPLETED',
    },
    ticketTypes: {
      heading: 'TICKET TYPES',
      hint: 'Pricing and capacity plan only — no tickets are actually sold until a later batch.',
      empty: 'No ticket types yet.',
      add: 'ADD TICKET TYPE',
      name: 'NAME',
      description: 'DESCRIPTION',
      price: 'PRICE (USD)',
      capacity: 'CAPACITY',
      perOrderLimit: 'PER-ORDER LIMIT',
      active: 'ACTIVE',
    },
  },

  orders: {
    heading: 'ORDERS',
    hint: 'Shop and ticket orders share this list, filterable by type. This is a separate domain from campaign contributions — nothing here ever touches a campaign total or supporter/sponsor ranking.',
    empty: 'No orders yet.',
    orderNumber: 'ORDER',
    type: 'TYPE',
    status: 'STATUS',
    buyer: 'BUYER',
    total: 'TOTAL',
    placed: 'PLACED',
    items: 'ITEMS',
    payments: 'PAYMENTS',
    refunds: 'REFUNDS',
    issueRefund: 'ISSUE REFUND',
    refundAmount: 'REFUND AMOUNT (USD)',
    refundReason: 'REASON',
    provider: 'PROVIDER',
    providerRef: 'PROVIDER REFERENCE',
    regenerateLink: 'REGENERATE CONFIRMATION LINK',
    regenerateLinkHint: 'Invalidates the previous link immediately. Use if it was shared somewhere it shouldn’t have been.',
    resendTickets: 'RESEND TICKET EMAIL',
    fulfillment: {
      heading: 'FULFILLMENT',
      shipTo: 'SHIP TO',
      status: 'STATUS',
      carrier: 'CARRIER',
      trackingNumber: 'TRACKING NUMBER',
      notes: 'NOTES',
      statuses: {
        unfulfilled: 'UNFULFILLED',
        fulfilled: 'FULFILLED',
        partial: 'PARTIAL',
      },
    },
  },

  checkIn: {
    heading: 'CHECK-IN',
    hint: 'Scan a ticket QR or type its code. Redemption is authenticated and atomic — two scans of the same ticket can never both succeed.',
    selectEvent: 'EVENT',
    codeLabel: 'SCAN OR TYPE CODE',
    submit: 'CHECK IN',
    resultSuccess: 'CHECKED IN',
    resultAlreadyCheckedIn: 'ALREADY CHECKED IN',
    resultVoid: 'TICKET VOID',
    resultWrongEvent: 'WRONG EVENT',
    resultInvalid: 'NOT A VALID TICKET',
    reverseCheckIn: 'REVERSE (SCANNED BY MISTAKE)',
    reversalReason: 'REASON',
  },

  attendees: {
    heading: 'ATTENDEES',
    hint: 'Every ticket issued for this event. Voiding or reissuing is a deliberate, separate action from any refund — money and admission are never auto-linked.',
    empty: 'No tickets issued yet.',
    status: 'STATUS',
    code: 'CODE',
    issued: 'ISSUED',
    checkedInAt: 'CHECKED IN',
    void: 'VOID',
    reissue: 'REISSUE',
    reason: 'REASON',
  },

  shop: {
    heading: 'SHOP',
    hint: 'No checkout yet — this is the product catalog and inventory plan. Selling merch lands in a later batch.',
    create: 'NEW PRODUCT',
    createHeading: 'NEW PRODUCT',
    empty: 'No products yet.',
    title: 'TITLE',
    slug: 'SLUG',
    status: 'STATUS',
    published: 'FEATURED',
    description: 'DESCRIPTION',
    featured: 'FEATURED ON HOMEPAGE / SHOP TOP',
    sortIndex: 'SORT ORDER',
    saleStartAt: 'SALE START (OPTIONAL)',
    saleEndAt: 'SALE END (OPTIONAL)',
    shippingRequired: 'REQUIRES SHIPPING',
    statuses: {
      draft: 'DRAFT',
      active: 'ACTIVE',
      archived: 'ARCHIVED',
    },
    media: {
      heading: 'PHOTOS',
      upload: 'UPLOAD',
      hint: 'PNG, WebP, or JPEG, up to 5MB.',
    },
    variants: {
      heading: 'VARIANTS',
      hint: 'Pricing and stock plan only — no checkout sells against these yet.',
      empty: 'No variants yet.',
      add: 'ADD VARIANT',
      name: 'NAME',
      sku: 'SKU',
      price: 'PRICE (USD)',
      compareAt: 'COMPARE-AT PRICE (OPTIONAL)',
      active: 'ACTIVE',
      stock: 'STOCK ON HAND',
      adjustStock: 'ADJUST STOCK',
      delta: 'CHANGE (+/-)',
      reason: 'REASON',
      note: 'NOTE (OPTIONAL)',
      reasons: {
        restock: 'RESTOCK',
        sale: 'SALE',
        manual_adjustment: 'MANUAL ADJUSTMENT',
        return: 'RETURN',
      },
    },
  },

  saved: 'SAVED',
  failed: 'FAILED',
} as const;
