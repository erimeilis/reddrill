declare module '@mailchimp/mailchimp_transactional/sender' {
  interface MandrillSender {
    address: string;
    created_at: string;
    sent: number;
    hard_bounces: number;
    soft_bounces: number;
    rejects: number;
    complaints: number;
    unsubs: number;
    opens: number;
    clicks: number;
    unique_opens: number;
    unique_clicks: number;
  }

  interface MandrillSenderInfo extends MandrillSender {
    stats: {
      today: MandrillSenderStats;
      last_7_days: MandrillSenderStats;
      last_30_days: MandrillSenderStats;
      last_60_days: MandrillSenderStats;
      last_90_days: MandrillSenderStats;
    };
    dkim: {
      signed_by: string | null;
      valid: boolean;
    };
    spf: {
      valid: boolean;
      valid_with_dkim: boolean;
    };
  }

  interface MandrillSenderStats {
    sent: number;
    hard_bounces: number;
    soft_bounces: number;
    rejects: number;
    complaints: number;
    unsubs: number;
    opens: number;
    clicks: number;
    unique_opens: number;
    unique_clicks: number;
  }

  interface MandrillSenderClient {
    list: () => Promise<MandrillSender[]>;
    info: (params: { address: string }) => Promise<MandrillSenderInfo>;
    // Other sender-related methods as needed
  }
}