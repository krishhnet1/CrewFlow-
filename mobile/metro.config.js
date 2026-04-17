// Expo SDK 54 Metro config.
// In a workspace (mobile/ inside app/) npm hoists react-native to the root
// but leaves a second copy of `react` inside mobile/node_modules. That produces
// two React instances at runtime → "Invalid hook call". The aliases below force
// Metro to always resolve react / react-native from the workspace root.
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Watch the workspace root so Metro picks up hoisted packages.
config.watchFolders = [workspaceRoot];

// Prefer the root copy of every package; fall back to the local one.
config.resolver.nodeModulesPaths = [
  path.resolve(workspaceRoot, 'node_modules'),
  path.resolve(projectRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;

// Hard-lock the single React / React Native instance.
config.resolver.extraNodeModules = {
  react: path.resolve(workspaceRoot, 'node_modules/react'),
  'react-native': path.resolve(workspaceRoot, 'node_modules/react-native'),
  'react/jsx-runtime': path.resolve(workspaceRoot, 'node_modules/react/jsx-runtime'),
  'react/jsx-dev-runtime': path.resolve(workspaceRoot, 'node_modules/react/jsx-dev-runtime'),
};

module.exports = config;
