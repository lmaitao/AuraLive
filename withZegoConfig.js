const { withProjectBuildGradle, withAppBuildGradle } = require('@expo/config-plugins');

module.exports = function withZegoConfig(config) {
  // 1. Añadir el repositorio Maven en el build.gradle del proyecto
  config = withProjectBuildGradle(config, (config) => {
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

  // 2. Añadir pickFirst para libc++_shared.so en el build.gradle de la app
  config = withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      let buildGradle = config.modResults.contents;
      if (!buildGradle.includes('pickFirst \'lib/x86/libc++_shared.so\'')) {
        const packagingOptionsBlock = `
    packagingOptions {
        pickFirst 'lib/x86/libc++_shared.so'
        pickFirst 'lib/x86_64/libc++_shared.so'
        pickFirst 'lib/armeabi-v7a/libc++_shared.so'
        pickFirst 'lib/arm64-v8a/libc++_shared.so'
    }
`;
        // Insert inside android { ... }
        if (buildGradle.includes('android {')) {
          config.modResults.contents = buildGradle.replace(
            /android\s*\{/,
            `android {${packagingOptionsBlock}`
          );
        }
      }
    }
    return config;
  });

  return config;
};
