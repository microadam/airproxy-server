module.exports = createSocketServer

var Primus = require('primus')
  , Emitter = require('primus-emitter')
  , createHandleConnection = require('./lib/connection-handler')

function createSocketServer( port, groupManager, zoneManager ) {
  var server = Primus.createServer(
    { port: port
      , transformer: 'websockets'
      , iknowhttpsisbetter: true
      , parser: 'JSON'
    }
  )
  var handleConnection = createHandleConnection(groupManager, zoneManager)

  server.use('emitter', Emitter)
  server.on('connection', handleConnection)

  zoneManager.on('add', sendGroupsToAll)
  zoneManager.on('remove', sendGroupsToAll)
  groupManager.on('change', sendGroupsToAll)

  function sendGroupsToAll() {
    server.send('groups', groupManager.getGroupsWithZoneData())
  }
}


