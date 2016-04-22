start:
	docker-compose up -d mongo

stop:
	docker-compose stop

kill: stop
	docker-compose rm
