url-shortener backend
=========================
Self hosted url shortener written in nodejs.


## Getting Started

`Docker` and `Docker Compose` are required to serve the influxdb. OS X developers could use [dinghy](https://github.com/codekitchen/dinghy).

to start the database:

```
make start
```

open http://influxdb.docker:8083 to visit the influxdb web console.

than start the node backend:

```
npm start
```

open http://localhost:3000 to see the server status.

## Stop Server

```
make stop
```

or you can remove absolutely:
```
make kill
```
