const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')

const config = withNativeWind(getDefaultConfig(__dirname), {
  input: './src/global.css',
})
config.resolver.unstable_enablePackageExports = true

module.exports = config
