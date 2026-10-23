package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/saalim829/CodeQuest/gamification/internal/engine"
)

func main() {
	secret := os.Getenv("GAMIFICATION_SERVICE_TOKEN")
	if len(secret) < 32 {
		log.Fatal("GAMIFICATION_SERVICE_TOKEN must be at least 32 characters")
	}

	mux := http.NewServeMux()

	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{
			"status":  "ok",
			"service": "CodeQuest Gamification",
		})
	})

	mux.HandleFunc("POST /internal/gamification/award", func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("X-Service-Token") != secret {
			writeJSON(w, http.StatusUnauthorized, map[string]string{
				"message": "Unauthorized service request",
			})
			return
		}

		r.Body = http.MaxBytesReader(w, r.Body, 10*1024)
		defer r.Body.Close()

		var req engine.AwardRequest

		decoder := json.NewDecoder(r.Body)
		decoder.DisallowUnknownFields()

		if err := decoder.Decode(&req); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{
				"message": "Invalid request body",
			})
			return
		}

		// Reject a second JSON value or trailing JSON data.
		if err := decoder.Decode(&struct{}{}); err != nil && err.Error() != "EOF" {
			writeJSON(w, http.StatusBadRequest, map[string]string{
				"message": "Invalid request body",
			})
			return
		} else if err == nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{
				"message": "Only one JSON object is allowed",
			})
			return
		}

		state, err := engine.Calculate(req)
		if err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{
				"message": err.Error(),
			})
			return
		}

		writeJSON(w, http.StatusOK, state)
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}

	server := &http.Server{
		Addr:              ":" + port,
		Handler:           mux,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      10 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	log.Printf("CodeQuest Gamification service listening on port %s", port)
	log.Fatal(server.ListenAndServe())
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}
