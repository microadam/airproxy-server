#!/bin/bash

avahi-daemon -D --no-drop-root --no-chroot
node index.js /config/config.json
