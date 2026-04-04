const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    asar: true,
    icon: 'public/favicon',
    extraResource: [
      './build',
      './app-update.yml'
    ],
    // Only include files needed at runtime; build/ is already in extraResource
    ignore: (path) => {
      if (!path) return false;
      // Always include package.json and forge.config.js (root)
      if (path === '/package.json' || path === '/forge.config.js') return false;
      // Include electron main + preload
      if (path === '/public' || path === '/public/electron.js' || path === '/public/preload.js' || path === '/public/favicon.ico') return false;
      // Include production node_modules (electron-updater, electron-squirrel-startup + deps)
      if (path === '/node_modules') return false;
      if (path.startsWith('/node_modules/electron-updater') ||
          path.startsWith('/node_modules/electron-squirrel-startup') ||
          // electron-updater dependencies
          path.startsWith('/node_modules/builder-util-runtime') ||
          path.startsWith('/node_modules/debug') ||
          path.startsWith('/node_modules/ms') ||
          path.startsWith('/node_modules/sax') ||
          path.startsWith('/node_modules/lazy-val') ||
          path.startsWith('/node_modules/lodash.isequal') ||
          path.startsWith('/node_modules/lodash.escaperegexp') ||
          path.startsWith('/node_modules/semver') ||
          path.startsWith('/node_modules/tiny-typed-emitter') ||
          path.startsWith('/node_modules/js-yaml') ||
          path.startsWith('/node_modules/argparse') ||
          path.startsWith('/node_modules/fs-extra') ||
          path.startsWith('/node_modules/graceful-fs') ||
          path.startsWith('/node_modules/jsonfile') ||
          path.startsWith('/node_modules/universalify')) {
        return false;
      }
      // Ignore everything else
      return true;
    },
  },
  rebuildConfig: {},
  makers: [
    // {
    //   name: '@electron-forge/maker-zip',
    //   platforms: ['win32'],
    // },
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        authors: 'FactorClaim',
        description: 'FactorClaim Desktop Application',
        name: 'factorclaim-desktop',
        setupIcon: 'public/favicon.ico',
        noMsi: true,
        setupExe: 'FactorClaimSetup.exe'
      },
    }
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'abdulahad1015',
          name: 'FactorClaim'
        },
        prerelease: false,
        draft: true
      }
    }
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
