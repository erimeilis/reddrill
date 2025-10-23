declare module '@mailchimp/mailchimp_transactional' {
  import { MandrillTemplateClient } from '@mailchimp/mailchimp_transactional/template';
  import { MandrillTagClient } from '@mailchimp/mailchimp_transactional/tag';
  import { MandrillSenderClient } from '@mailchimp/mailchimp_transactional/sender';

  interface MandrillClient {
    templates: MandrillTemplateClient;
    tags: MandrillTagClient;
    senders: MandrillSenderClient;
  }

  function mailchimp(apiKey: string): MandrillClient;
  export default mailchimp;
}
