var bunyan = require('bunyan')
  , logger = bunyan.createLogger({ name: 'airproxy-server' })
  , airProxy = require('airproxy')(logger)
  , zoneListener = airProxy.zoneListener
  , Primus = require('primus')
  , Emitter = require('primus-emitter')
  , ZoneManager = require('./lib/zone-manager')
  , zoneManager = new ZoneManager()
  , GroupManager = require('./lib/group-manager')
  , groupManager = new GroupManager(airProxy, zoneManager)
  , createHandleConnection = require('./lib/connection-handler')
  , handleConnection = createHandleConnection(groupManager, zoneManager)
  , server = Primus.createServer(
      { port: 8080
      , transformer: 'websockets'
      , iknowhttpsisbetter: true
      , parser: 'JSON'
      }
    )

server.use('emitter', Emitter)
server.on('connection', handleConnection)

zoneListener.on('zoneUp', zoneManager.add.bind(zoneManager))
zoneListener.on('zoneDown', function (zoneName) {
  groupManager.removeZone(zoneName)
  zoneManager.remove(zoneName)
})

airProxy.groupManager.on('volumeUp', groupManager.volumeUp.bind(groupManager))
airProxy.groupManager.on('volumeDown', groupManager.volumeDown.bind(groupManager))
airProxy.groupManager.on('metadataChange', groupManager.setNowPlaying.bind(groupManager))
airProxy.groupManager.on('clientDisconnected', function (groupName) {
  groupManager.setNowPlaying(groupName, null)
})

zoneManager.on('add', sendGroupsToAll)
zoneManager.on('remove', sendGroupsToAll)
groupManager.on('change', sendGroupsToAll)

function sendGroupsToAll() {
  server.send('groups', groupManager.getGroupsWithZoneData())
}
