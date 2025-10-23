declare module '@mailchimp/mailchimp_transactional/template' {
  interface MandrillTemplate {
    slug: string;
    name: string;
    labels: string[];
    code: string;
    subject: string;
    from_email: string;
    from_name: string;
    text: string;
    publish_name: string;
    publish_code: string;
    publish_subject: string;
    publish_from_email: string;
    publish_from_name: string;
    publish_text: string;
    published_at: string;
    created_at: string;
    updated_at: string;
    draft_updated_at: string;
  }

  interface MandrillTemplateInfo extends MandrillTemplate {
    publish_code: string;
  }

  interface MandrillTemplateClient {
    list: () => Promise<MandrillTemplate[]>;
    info: (params: { name: string }) => Promise<MandrillTemplateInfo>;
    update: (params: {
      name: string;
      code?: string;
      subject?: string;
      from_email?: string;
      from_name?: string;
      text?: string;
      labels?: string[];
    }) => Promise<MandrillTemplate>;
    add: (params: {
      name: string;
      code?: string;
      subject?: string;
      from_email?: string;
      from_name?: string;
      text?: string;
      labels?: string[];
    }) => Promise<MandrillTemplate>;
    delete: (params: { name: string }) => Promise<MandrillTemplate>;
  }
}