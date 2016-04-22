start:
	docker-compose up -d

stop:
	docker-compose stop

kill: stop
	docker-compose rm
