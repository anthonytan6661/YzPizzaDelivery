/*
 * Create and export configuration variables
 *
 */

// Container for all environments
var environments = {};

// Staging (default) environment
environments.staging = {
  'httpPort' : 3200,
  'httpsPort' : 3201,
  'envName' : 'staging',
  'hashingSecret' : 'thisIsASecret',
  'currency' : 'usd',
  'stripe' : 'sk_test_fcMqpJQTggJmPJnCzjximzqw',
  'mailGun': {
    'domain' : 'sandbox17fe3c9594d64ab1aa2b11e3f93a934d.mailgun.org',
    'from' : 'Mailgun Sandbox <postmaster@sandbox17fe3c9594d64ab1aa2b11e3f93a934d.mailgun.org>',
    'apiKey' :'1093d44556c5ca3d93c7c7035f254c01-b3780ee5-ece7dbf2'
  }

};

// Production environment
environments.production = {
  'httpPort' : 5200,
  'httpsPort' : 5201,
  'envName' : 'production',
  'hashingSecret' : 'thisIsAlsoASecret',
  'currency' : 'usd',
  'stripe' : 'sk_test_fcMqpJQTggJmPJnCzjximzqw',
  'mailGun': {
    'domain' : 'sandbox17fe3c9594d64ab1aa2b11e3f93a934d.mailgun.org',
    'from' : 'Mailgun Sandbox <postmaster@sandbox17fe3c9594d64ab1aa2b11e3f93a934d.mailgun.org>',
    'apiKey' :'1093d44556c5ca3d93c7c7035f254c01-b3780ee5-ece7dbf2'
  }
};

// Determine which environment was passed as a command-line argument
var currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check that the current environment is one of the environments above, if not default to staging
var environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

// Export the module
module.exports = environmentToExport;
