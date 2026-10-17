const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const closedPrelaunch = process.env.EXPO_PUBLIC_CLOSED_PRELAUNCH_VISUAL_UAT === '1';
const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const normalised = String(moduleName).replace(/\\/g, '/');
  if (!closedPrelaunch && /closedPrelaunchMarks$/.test(normalised) && !normalised.includes('.stub')) {
    const stub = normalised.replace(/closedPrelaunchMarks$/, 'closedPrelaunchMarks.stub');
    if (defaultResolveRequest) return defaultResolveRequest(context, stub, platform);
    return context.resolveRequest(context, stub, platform);
  }
  if (defaultResolveRequest) return defaultResolveRequest(context, moduleName, platform);
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

