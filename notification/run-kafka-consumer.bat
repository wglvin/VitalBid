
@echo off
echo Running Kafka consumer inside Docker container...
docker exec -it notification node test-kafka-consumer.js %*
