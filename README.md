## Quickstart

    apt-get install libavahi-compat-libdnssd-dev

    docker run -d -v <path/to/dir/containing/config>:/config -v /var/run/dbus:/var/run/dbus --net=host --privileged --name airproxy --restart=always microadam/airproxy

## Config File

    {
      "port": 7878,
      "groups": [
        { "name": "Home",
          "zones": [
            "Kitchen",
            "Cinema",
            "Bedroom"
          ]
        }
      ]
    }
