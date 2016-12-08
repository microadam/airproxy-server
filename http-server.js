module.exports = createServer

function createServer(port, groupManager, zoneManager) {
  var express = require('express')
  var app = express()

  app.get('/:group/:zone', function (req, res) {

    if (req.query.enabled === 'true') {
      groupManager.addZone(req.params.group, req.params.zone)
      res.sendStatus(200)
    } else if (req.query.enabled === 'false') {
      groupManager.removeZone(req.params.zone)
      res.sendStatus(200)
    }

    if (req.query.volume) {
      zoneManager.setVolume(req.params.zone, req.query.volume)
      res.sendStatus(200)
    }
  })

  app.listen(port)
}