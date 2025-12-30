const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo config plugin to optimize Gradle properties for CI builds
 */
const withGradleProperties = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const gradlePropertiesPath = path.join(
        config.modRequest.platformProjectRoot,
        'gradle.properties'
      );

      if (fs.existsSync(gradlePropertiesPath)) {
        let gradleProperties = fs.readFileSync(gradlePropertiesPath, 'utf8');

        // Optimize JVM args for memory usage
        gradleProperties = gradleProperties.replace(
          /org\.gradle\.jvmargs=.*/,
          'org.gradle.jvmargs=-Xmx1536m -XX:MaxMetaspaceSize=512m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8'
        );

        // Disable parallel builds for CI
        gradleProperties = gradleProperties.replace(
          /org\.gradle\.parallel=.*/,
          'org.gradle.parallel=false'
        );

        // Build only arm64-v8a to reduce memory
        gradleProperties = gradleProperties.replace(
          /reactNativeArchitectures=.*/,
          'reactNativeArchitectures=arm64-v8a'
        );

        // Add caching if not present
        if (!gradleProperties.includes('org.gradle.caching')) {
          gradleProperties += '\norg.gradle.caching=true\n';
        }

        fs.writeFileSync(gradlePropertiesPath, gradleProperties, 'utf8');
        console.log('✅ Gradle properties optimized for CI build');
      }

      return config;
    },
  ]);
};

module.exports = withGradleProperties;
