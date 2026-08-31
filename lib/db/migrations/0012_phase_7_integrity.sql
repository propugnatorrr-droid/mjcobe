CREATE UNIQUE INDEX IF NOT EXISTS
  transactions_provider_ref_unique_idx
ON transactions (
  provider,
  provider_ref
)
WHERE provider_ref IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS
  ledger_transaction_settlement_unique_idx
ON ledger_entries (
  transaction_id
)
WHERE
  kind = 'contribution'
  AND transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS
  contributions_referral_link_idx
ON contributions (
  referral_link_id
);

CREATE INDEX IF NOT EXISTS
  referral_visits_link_session_idx
ON referral_visits (
  referral_link_id,
  session_id
);

CREATE INDEX IF NOT EXISTS
  ledger_contribution_idx
ON ledger_entries (
  contribution_id
);

CREATE INDEX IF NOT EXISTS
  ledger_campaign_identity_idx
ON ledger_entries (
  campaign_id,
  supporter_id,
  sponsor_id
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE
      conname =
        'contributions_referral_link_fk'
  ) THEN
    ALTER TABLE contributions
      ADD CONSTRAINT
        contributions_referral_link_fk
      FOREIGN KEY (
        referral_link_id
      )
      REFERENCES referral_links(id)
      ON DELETE SET NULL;
  END IF;
END

$$;
