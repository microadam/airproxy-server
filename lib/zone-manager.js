module.exports = ZoneManager

var Emitter = require('events').EventEmitter
  , values = require('lodash.values')

function ZoneManager() {
  Emitter.call(this)
  this.zones = {}
  this.a = 1
}

ZoneManager.prototype = Object.create(Emitter.prototype)

ZoneManager.prototype.getZones = function () {
  return values(this.zones)
}

ZoneManager.prototype.add = function (zone) {
  var zoneToSave =
    { host: zone.host
    , port: zone.port
    , name: zone.name
    , volumeMultiplier: 1
    , volume: 50
    }
  this.zones[zone.name] = zoneToSave
  this.emit('add', zoneToSave)
}

ZoneManager.prototype.remove = function (zoneName) {
  this.emit('remove', this.zones[zoneName])
  delete this.zones[zoneName]
}

ZoneManager.prototype.get = function (zoneName, property) {
  return this.zones[zoneName][property]
}

ZoneManager.prototype.setVolumeMultiplier = function (zoneName, multiplier) {
  return this.zones[zoneName].volumeMultiplier = multiplier
}

ZoneManager.prototype.setVolume = function (zoneName, volume, supressChangeEvent) {
  volume = Math.ceil(volume)
  if (volume < 0) {
    volume = 0
  } else if (volume > 100) {
    volume = 100
  }
  this.zones[zoneName].volume = volume
  this.emit('volumeChange', zoneName, volume, supressChangeEvent)
}
