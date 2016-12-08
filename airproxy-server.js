var bunyan = require('bunyan')
  , logger = bunyan.createLogger({ name: 'airproxy-server' })
  , airProxy = require('airproxy')(logger)
  , createSocketServer = require('./socket-server')
  , createHttpServer = require('./http-server')
  , zoneListener = airProxy.zoneListener
  , ZoneManager = require('./lib/zone-manager')
  , zoneManager = new ZoneManager()
  , GroupManager = require('./lib/group-manager')
  , groupManager = new GroupManager(airProxy, zoneManager)
  , initialConfig = {}

try {
  initialConfig = require(process.argv[2])
} catch (e) {
  logger.info('no initial config')
}

createSocketServer(initialConfig.port || 8080, groupManager, zoneManager)
createHttpServer(initialConfig.httpPort || 8181, groupManager, zoneManager)

zoneListener.on('zoneUp', zoneManager.add.bind(zoneManager))
zoneListener.on('zoneDown', function (zoneName) {
  groupManager.removeZone(zoneName)
  zoneManager.remove(zoneName)
})

airProxy.groupManager.on('volumeUp', groupManager.volumeUp.bind(groupManager))
airProxy.groupManager.on('volumeDown', groupManager.volumeDown.bind(groupManager))
airProxy.groupManager.on('metadataChange', groupManager.setNowPlaying.bind(groupManager))
airProxy.groupManager.on('clientConnected', function (groupName) {
  groupManager.setNowPlaying(groupName, { asar: 'Something', asal: 'is', minm: 'playing' })
})
airProxy.groupManager.on('clientDisconnected', function (groupName) {
  groupManager.setNowPlaying(groupName, null)
})

if (initialConfig) {
  initialConfig.groups.forEach(function (group) {
    groupManager.create(group.name)
  })
}

zoneManager.on('add', function (zone) {
  if (!initialConfig) return
  initialConfig.groups.forEach(function (group) {
    if (!group.zones) return
    group.zones.forEach(function (zoneName) {
      if (zoneName !== zone.name) return
      groupManager.addZone(group.name, zoneName)
    })
  })
})