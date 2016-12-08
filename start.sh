#!/bin/bash

avahi-daemon -D --no-drop-root --no-chroot
node airproxy-server.js /config/config.json
