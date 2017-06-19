var fs = require('fs')
var log = require('npmlog')

function addBranchConfigToAndroidAssetsFolder() {
  if (fs.existsSync('./branch.json')) {
    ensureAndroidAssetsFolder('main')
    addSymbolicLink('../../../../../branch.json', './android/app/src/main/assets/branch.json')
  }

  // branch.debug.json will be available as branch.json in debug builds
  if (fs.existsSync('./branch.debug.json')) {
    ensureAndroidAssetsFolder('debug')
    addSymbolicLink('../../../../../branch.debug.json', './android/app/src/debug/assets/branch.json')
  }

  log.info('Added Branch configuration to android project')
}

function addSymbolicLink(linkPath, path) {
  try {
    var stats = fs.lstatSync(path)
    if (stats && stats.isSymbolicLink()) {
      var dest = fs.readlinkSync(path)
      if (dest == linkPath) {
        log.warn(path + ' already present in Android app')
        return
      }

      log.error(path + ' is a link to ' + linkPath + '.')
      return
    }
    if (stats) {
      log.error(path + ' exists and is not a symbolic link.')
      return
    }
  }
  catch (error) {
    if (error.code != 'ENOENT') throw error

    // ./android/app/src/main/assets exists and is a directory.
    // ./android/app/src/main/assets/branch.json does not exist.
    // create the symlink
    fs.symlinkSync(linkPath, path)
  }
}

function removeSymbolicLink(path) {
  try {
    var stats = fs.lstatSync(path)
  }
  catch (error) {
    if (error.code != 'ENOENT') throw error
    // Not present. Quietly do nothing.
    return
  }

  if (!stats.isSymbolicLink()) {
    log.warn(path + ' is not a symbolic link. Not removing.')
    return
  }

  fs.unlink(path)
}

function ensureAndroidAssetsFolder(buildType) {
  ensureDirectory('./android/app/src/' + buildType + '/assets')
}

function ensureDirectory(path) {
  try {
    var stats = fs.statSync(path)

    if (!stats.isDirectory()) {
      throw(srcDir + ' exists and is not a directory.')
    }
  }
  catch (error) {
    if (error.code != 'ENOENT') throw error

    var parent = dirname(path)
    if (parent !== path) ensureDirectory(parent)

    fs.mkdirSync(path, 0o777)
  }
}

function dirname(path) {
  if (!path.match(/\//)) return path

  return /^(.*)\/[^/]+$/.exec(path)[1]
}

function removeBranchConfigFromAndroidAssetsFolder() {
  removeSymbolicLink('./android/app/src/main/assets/branch.json')
  removeSymbolicLink('./android/app/src/debug/assets/branch.json')
  log.info('removed Branch configuration from Android project.')
}

module.exports = {
  addBranchConfigToAndroidAssetsFolder: addBranchConfigToAndroidAssetsFolder,
  removeBranchConfigFromAndroidAssetsFolder: removeBranchConfigFromAndroidAssetsFolder
}