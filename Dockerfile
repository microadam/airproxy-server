FROM node:6.9.1

RUN apt-get update && apt-get install -y libavahi-compat-libdnssd-dev

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
RUN npm install
COPY . /usr/src/app

RUN chmod +x /usr/src/app/start.sh

VOLUME [ "/config", "/var/run/dbus" ]

CMD [ "/usr/src/app/start.sh" ]
