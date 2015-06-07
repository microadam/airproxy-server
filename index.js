var airProxy = require('air-proxy')()
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

airProxy.groupManager.on('volumeChange', groupManager.setMasterVolume.bind(groupManager))
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

// var zones = {}
//   , groups = {}

// var groups =
//   { 'House':
//     { name: 'House'
//     , volume: 100
//     , nowPlaying: { song: 'Song Name', album: 'Album Name', artist: 'Artist Name' }
//     , zones:
//       [ 'Kitchen'
//       ]
//     }
//   }

// airProxy.groupManager.on('volumeChange', function (groupName, volume) {
//   setGroupMasterVolume(groupName, volume)
//   server.send('groups', getGroups())
// })

// airProxy.groupManager.on('metadataChange', function (groupName, meta) {
//   setGroupMetadata(groupName, meta)
//   server.send('groups', getGroups())
// })

// airProxy.groupManager.on('clientDisconnected', function (groupName) {
//   setGroupMetadata(groupName, null)
//   server.send('groups', getGroups())
// })

// zoneListener.on('zoneUp', function (zone) {
//   var zoneToSave = {}
//   zoneToSave.host = zone.host
//   zoneToSave.port = zone.port
//   zoneToSave.name = zone.name
//   zoneToSave.volume = 50
//   zones[zone.name] = zoneToSave
//   server.send('groups', getGroups())
// })

// zoneListener.on('zoneDown', function (zoneName) {
//   values(groups).forEach(function (group) {
//     var index = group.zones.indexOf(zoneName)
//     if (index > -1) {
//       group.zones.splice(index, 1)
//       airProxy.groupManager.removeZone(group.name, zoneName)
//     }
//   })
//   delete zones[zoneName]
//   server.send('groups', getGroups())
// })

// server.on('connection', function (spark) {

  // spark.send('groups', getGroups())

  // spark.on('masterVolumeChange', function (group) {
  //   setGroupMasterVolume(group.name, group.volume)

  //   server.forEach(function (s, id) {
  //     if (id !== spark.id) {
  //       s.send('groups', getGroups())
  //     }
  //   })
  // })

  // spark.on('zoneVolumeChange', function (zone) {
  //   var group = getGroupContainingZone(zone.name)
  //   zones[zone.name].volumeMultiplier = zone.volume / group.volume
  //   setZoneVolume(group.name, zone.name, zone.volume)

  //   server.forEach(function (s, id) {
  //     if (id !== spark.id) {
  //       s.send('groups', getGroups())
  //     }
  //   })
  // })

  // spark.on('zoneStateChange', function (data) {
  //   if (data.enabled) {
  //     var zone = zones[data.zoneName]
  //       , group = groups[data.groupName]

  //     airProxy.groupManager.addZone(data.groupName, zone)

  //     zone.volumeMultiplier = zone.volume / group.volume
  //     setZoneVolume(group.name, zone.name, zone.volumeMultiplier * group.volume)

  //     group.zones.push(data.zoneName)
  //   } else if (!data.enabled) {
  //     airProxy.groupManager.removeZone(data.groupName, data.zoneName)
  //     var removeIndex = groups[data.groupName].zones.indexOf(data.zoneName)
  //     groups[data.groupName].zones.splice(removeIndex, 1)
  //   }
  //   server.send('groups', getGroups())
  // })

  // spark.on('newGroup', function (group) {
  //   airProxy.groupManager.create(group.name)
  //   group.zones = []
  //   group.volume = 50
  //   group.nowPlaying = null
  //   groups[group.name] = group
  //   server.send('groups', getGroups())
  // })

  // spark.on('destroyGroup', function (groupToDestroy) {
  //   airProxy.groupManager.destroy(groupToDestroy)
  //   delete groups[groupToDestroy]
  //   server.send('groups', getGroups())
  // })

// })

// function getZonesInGroup(groupName) {
//   var zonesInGroup = []
//     , zoneNames = groups[groupName].zones

//   values(zones).forEach(function (zone) {
//     if (zoneNames.indexOf(zone.name) > -1) {
//       zonesInGroup.push(zone)
//     }
//   })

//   return zonesInGroup
// }

// function getGroupContainingZone(zoneName) {
//   var foundGroup = null
//   values(groups).some(function (group) {
//     if (group.zones.indexOf(zoneName) > -1) {
//       foundGroup = group
//       return true
//     }
//     return false
//   })
//   return foundGroup
// }

// function setZoneVolume(groupName, zoneName, volume) {
//   if (volume < 0) {
//     volume = 0
//   } else if (volume > 100) {
//     volume = 100
//   }
//   zones[zoneName].volume = Math.ceil(volume)
//   var zone = airProxy.groupManager.getZone(groupName, zoneName)
//   zone.device.setVolume(volume)
// }

// function setGroupMasterVolume(groupName, groupVolume) {
//   groups[groupName].volume = Math.ceil(groupVolume)
//   var zonesInGroup = getZonesInGroup(groupName)
//   zonesInGroup.forEach(function (zone) {
//     setZoneVolume(groupName, zone.name, zone.volumeMultiplier * groupVolume)
//   })
// }

// function setGroupMetadata(groupName, meta) {
//   var nowPlaying = null
//   if (meta) {
//     nowPlaying = { song: meta.minm, album: meta.asal, artist: meta.asar }
//   }
//   groups[groupName].nowPlaying = nowPlaying
// }
