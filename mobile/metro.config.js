const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo (including packages/)
config.watchFolders = [workspaceRoot];

// 2. Resolve packages and node_modules from both mobile and root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Ensure extensions and symlinks resolve smoothly
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
