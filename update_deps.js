const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const updates = {
  "@shopify/flash-list": "2.0.2",
  "expo-asset": "~12.0.13",
  "expo-blur": "~15.0.8",
  "expo-constants": "~18.0.13",
  "expo-font": "~14.0.12",
  "expo-linking": "~8.0.12",
  "expo-router": "~6.0.24",
  "expo-status-bar": "~3.0.9",
  "expo-symbols": "~1.0.8",
  "expo-system-ui": "~6.0.9",
  "expo-web-browser": "~15.0.11",
  "react": "19.1.0",
  "react-dom": "19.1.0",
  "react-native": "0.81.5",
  "react-native-gesture-handler": "~2.28.0",
  "react-native-reanimated": "~4.1.1",
  "react-native-safe-area-context": "~5.6.0",
  "react-native-screens": "~4.16.0",
  "react-native-svg": "15.12.1",
  "react-native-web": "^0.21.0",
  "react-native-worklets": "0.5.1"
};

const devUpdates = {
  "@types/react": "~19.1.10"
};

for (const [dep, ver] of Object.entries(updates)) {
  if (pkg.dependencies[dep]) pkg.dependencies[dep] = ver;
}
for (const [dep, ver] of Object.entries(devUpdates)) {
  if (pkg.devDependencies[dep]) pkg.devDependencies[dep] = ver;
}

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('package.json updated!');
