module.exports = GroupManager

var values = require('lodash.values')
  , clone = require('lodash.clone')
  , Emitter = require('events').EventEmitter

function GroupManager(airProxy, zoneManager) {
  Emitter.call(this)

  this.airProxy = airProxy
  this.zoneManager = zoneManager
  this.groups = {}

  this.zoneManager.on('volumeChange', onVolumeChange.bind(this))
}

GroupManager.prototype = Object.create(Emitter.prototype)

GroupManager.prototype.getGroupsWithZoneData = function () {
  var mappedGroups = values(this.groups).map(function (group) {
    group = clone(group)
    group.zones = this.zoneManager.getZones().map(function (zone) {
      zone = clone(zone)
      if (group.zones.indexOf(zone.name) > -1) {
        zone.enabled = true
      } else {
        zone.enabled = false
      }
      return zone
    })
    return group
  }.bind(this))
  return mappedGroups
}

GroupManager.prototype.create = function (groupName) {
  this.airProxy.groupManager.create(groupName)
  var newGroup =
    { zones: []
    , volume: 50
    , nowPlaying: null
    , name: groupName
    }
  this.groups[groupName] = newGroup
  this.emit('change')
}

GroupManager.prototype.destroy = function (groupName) {
  this.airProxy.groupManager.destroy(groupName)
  delete this.groups[groupName]
  this.emit('change')
}

GroupManager.prototype.addZone = function (groupName, zoneName) {
  var zoneVolume = this.zoneManager.get(zoneName, 'volume')
    , groupVolume = this.getMasterVolume(groupName)
    , volumeMultiplier = zoneVolume / groupVolume
    , actualZoneVolume = Math.ceil(volumeMultiplier * groupVolume)
    , zone =
      { host: this.zoneManager.get(zoneName, 'host')
      , port: this.zoneManager.get(zoneName, 'port')
      , name: this.zoneManager.get(zoneName, 'name')
      , volume: actualZoneVolume
      }
  this.airProxy.groupManager.addZone(groupName, zone)
  this.groups[groupName].zones.push(zoneName)
  this.zoneManager.setVolumeMultiplier(zoneName, volumeMultiplier)
  this.zoneManager.setVolume(zoneName, actualZoneVolume)
}

GroupManager.prototype.removeZone = function (zoneName) {
  values(this.groups).forEach(function (group) {
    var index = group.zones.indexOf(zoneName)
    if (index > -1) {
      group.zones.splice(index, 1)
      this.airProxy.groupManager.removeZone(group.name, zoneName)
    }
  }.bind(this))
}

GroupManager.prototype.getMasterVolume = function (groupName) {
  if (!this.groups[groupName]) return 1
  return this.groups[groupName].volume
}

GroupManager.prototype.setMasterVolume = function (groupName, volume, supressChangeEvent) {
  volume = Math.ceil(volume)
  this.groups[groupName].volume = volume
  this.groups[groupName].zones.forEach(function (zoneName) {
    var volumeMultiplier = this.zoneManager.get(zoneName, 'volumeMultiplier')
    this.zoneManager.setVolume(zoneName, Math.ceil(volumeMultiplier * volume), supressChangeEvent)
  }.bind(this))
}

GroupManager.prototype.volumeUp = function (groupName) {
  var newVolume = this.groups[groupName].volume + (100 / 16)
  this.setMasterVolume(groupName, newVolume)
}

GroupManager.prototype.volumeDown = function (groupName) {
  var newVolume = this.groups[groupName].volume - (100 / 16)
  this.setMasterVolume(groupName, newVolume)
}

GroupManager.prototype.setNowPlaying = function (groupName, meta) {
  var nowPlaying = null
  if (meta) {
    nowPlaying = { song: meta.minm, album: meta.asal, artist: meta.asar }
  }
  this.groups[groupName].nowPlaying = nowPlaying
  this.emit('change')
}

GroupManager.prototype.getNameOfGroupContainingZone = function (zoneName) {
  var foundGroupName = null
  values(this.groups).some(function (group) {
    if (group.zones.indexOf(zoneName) > -1) {
      foundGroupName = group.name
      return true
    }
    return false
  })
  return foundGroupName
}

function onVolumeChange(zoneName, volume, supressChangeEvent) {
  var groupName = this.getNameOfGroupContainingZone(zoneName)

  this.airProxy.groupManager.setZoneVolume(groupName, zoneName, volume)

  if (!supressChangeEvent) {
    this.emit('change')
  }
}

