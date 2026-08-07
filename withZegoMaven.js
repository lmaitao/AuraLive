const { withProjectBuildGradle } = require('@expo/config-plugins');

module.exports = function withZegoMaven(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      const buildGradle = config.modResults.contents;
      if (!buildGradle.includes('https://storage.zego.im/maven')) {
        config.modResults.contents = buildGradle.replace(
          /allprojects\s*\{\s*repositories\s*\{/,
          `allprojects {\n    repositories {\n        maven { url 'https://storage.zego.im/maven' }`
        );
      }
    }
    return config;
  });
};
