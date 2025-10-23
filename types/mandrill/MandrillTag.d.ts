declare module '@mailchimp/mailchimp_transactional/tag' {
  interface MandrillTag {
    tag: string;
    reputation: number;
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

  interface MandrillTagInfo extends MandrillTag {
    stats: {
      today: MandrillTagStats;
      last_7_days: MandrillTagStats;
      last_30_days: MandrillTagStats;
      last_60_days: MandrillTagStats;
      last_90_days: MandrillTagStats;
    };
  }

  interface MandrillTagStats {
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

  interface MandrillTagClient {
    list: () => Promise<MandrillTag[]>;
    info: (params: { tag: string }) => Promise<MandrillTagInfo>;
    delete: (params: { tag: string }) => Promise<{ tag: string; deleted: boolean }>;
    // Other tag-related methods as needed
  }
}