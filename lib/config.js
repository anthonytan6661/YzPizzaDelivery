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
  'stripe' : 'sk_test_fcMqpJQTggJmPJnCzjximzqw'
};

// Production environment
environments.production = {
  'httpPort' : 5200,
  'httpsPort' : 5201,
  'envName' : 'production',
  'hashingSecret' : 'thisIsAlsoASecret',
  'currency' : 'usd',
  'stripe' : 'sk_test_fcMqpJQTggJmPJnCzjximzqw'
};

// Determine which environment was passed as a command-line argument
var currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check that the current environment is one of the environments above, if not default to staging
var environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

// Export the module
module.exports = environmentToExport;
