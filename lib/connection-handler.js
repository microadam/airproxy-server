module.exports = function createConnectionHandler(groupManager, zoneManager) {

  var initialConfig = null
  try {
    initialConfig = require('../initial-config.json')
  } catch (e) {
    console.log('no initial config')
  }

  function handleConnection(spark) {

    var currentGroups = groupManager.getGroupsWithZoneData()
    spark.send('groups', currentGroups)

    if (initialConfig && !currentGroups.length) {
      initialConfig.groups.forEach(function (group) {
        handleNewGroup({ name: group.name })
        if (group.zones) {
          group.zones.forEach(function (zoneName) {
            var data = { groupName: group.name, zoneName: zoneName, enabled: true }
            handleZoneStateChange.call(this, data)
          }.bind(this))
        }
      }.bind(this))
    }

    spark.on('newGroup', handleNewGroup.bind(this))
    spark.on('destroyGroup', groupManager.destroy.bind(groupManager))
    spark.on('masterVolumeChange', handleMasterVolumeChange.bind(this))
    spark.on('zoneVolumeChange', handleZoneVolumeChange.bind(this))
    spark.on('zoneStateChange', handleZoneStateChange.bind(this))

    function handleNewGroup(group) {
      groupManager.create(group.name)
    }

    function handleMasterVolumeChange(group) {
      groupManager.setMasterVolume(group.name, group.volume, true)
      sendToAllExcept.call(this, spark.id, 'groups', groupManager.getGroupsWithZoneData())
    }

    function handleZoneVolumeChange(zone) {
      var groupName = groupManager.getNameOfGroupContainingZone(zone.name)
        , groupVolume = groupManager.getMasterVolume(groupName)

      zoneManager.setVolumeMultiplier(zone.name, zone.volume / groupVolume)
      zoneManager.setVolume(zone.name, zone.volume, true)
      sendToAllExcept.call(this, spark.id, 'groups', groupManager.getGroupsWithZoneData())
    }

    function handleZoneStateChange(data) {
      if (data.enabled) {
        groupManager.addZone(data.groupName, data.zoneName)
      } else if (!data.enabled) {
        groupManager.removeZone(data.zoneName)
      }
      this.send('groups', groupManager.getGroupsWithZoneData())
    }

    function sendToAllExcept(exceptId, eventName, value) {
      this.forEach(function (s, id) {
        if (id !== exceptId) {
          s.send(eventName, value)
        }
      })
    }
  }

  return handleConnection

}
