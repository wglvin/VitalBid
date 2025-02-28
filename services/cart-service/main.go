package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/streadway/amqp"
)

// CartItem represents an item in the cart
type CartItem struct {
	ID       string  `json:"id"`
	OrganID  string  `json:"organ_id"`
	Quantity int     `json:"quantity"`
	Price    float64 `json:"price"`
}

// Cart holds a slice of CartItems
type Cart struct {
	Items []CartItem `json:"items"`
}

// Global in-memory cart for demo purposes
var cart = Cart{Items: []CartItem{}}

// addItem adds an item to the cart
func addItem(w http.ResponseWriter, r *http.Request) {
	var item CartItem
	if err := json.NewDecoder(r.Body).Decode(&item); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}
	cart.Items = append(cart.Items, item)
	// Optionally publish an event to RabbitMQ (AMQP)
	if err := publishCartEvent(fmt.Sprintf("Added item %s", item.ID)); err != nil {
		log.Printf("Failed to publish cart event: %v", err)
	}
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(cart)
}

// getCart returns the current cart
func getCart(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode(cart)
}

// publishCartEvent sends a message to RabbitMQ using AMQP
func publishCartEvent(message string) error {
	// Connect to RabbitMQ (use the docker-compose service name "rabbitmq")
	conn, err := amqp.Dial("amqp://admin:admin@rabbitmq:5672")
	if err != nil {
		return fmt.Errorf("failed to connect to RabbitMQ: %w", err)
	}
	defer conn.Close()

	ch, err := conn.Channel()
	if err != nil {
		return fmt.Errorf("failed to open a channel: %w", err)
	}
	defer ch.Close()

	// Declare the queue
	_, err = ch.QueueDeclare(
		"CART_EVENTS", // queue name
		true,          // durable
		false,         // auto-delete
		false,         // exclusive
		false,         // no-wait
		nil,           // arguments
	)
	if err != nil {
		return fmt.Errorf("failed to declare a queue: %w", err)
	}

	// Publish the message
	err = ch.Publish(
		"",            // exchange
		"CART_EVENTS", // routing key (queue name)
		false,         // mandatory
		false,         // immediate
		amqp.Publishing{
			ContentType: "text/plain",
			Body:        []byte(message),
		})
	if err != nil {
		return fmt.Errorf("failed to publish a message: %w", err)
	}

	log.Printf("Published event to CART_EVENTS: %s", message)
	return nil
}

func main() {
	r := mux.NewRouter()

	r.HandleFunc("/cart", addItem).Methods("POST")
	r.HandleFunc("/cart", getCart).Methods("GET")

	port := "8080"
	log.Printf("Cart service running on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}
