start:
	docker-compose up -d influxdb

stop:
	docker-compose stop

kill: stop
	docker-compose rm
