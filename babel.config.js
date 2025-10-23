module.exports = function (api) {
  const isWeb = api.caller((caller) => !!caller && caller.name === 'babel-loader');
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Web-only: support namespace export and transform import.meta usages
      isWeb && '@babel/plugin-proposal-export-namespace-from',
      isWeb && 'babel-plugin-transform-import-meta',
      // Native-only: enable worklets
      !isWeb && 'react-native-worklets/plugin',
    ].filter(Boolean),
  };
}