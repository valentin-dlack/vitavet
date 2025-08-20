import * as Sentry from '@sentry/nestjs';

Sentry.init({
  dsn: 'https://3a89c32f0639af41a5c70b6b7315d9bc@o4509878157836288.ingest.de.sentry.io/4509878161178704',

  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
  // Disable Sentry in test/CI environment
  enabled: process.env.NODE_ENV !== 'test',
});
