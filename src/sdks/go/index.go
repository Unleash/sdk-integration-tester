package main

import (
	"github.com/Unleash/unleash-client-go/v3/context"
	"github.com/gin-gonic/gin"
	"github.com/Unleash/unleash-client-go/v3"
	"net/http"
	"os"
)

var (
	API_KEY = os.Getenv("UNLEASH_API_TOKEN")
	API_URL = os.Getenv("UNLEASH_URL")
	port    = getenv("PORT", "5010")

)

type FeatureRequestBody struct {
	Toggle string `json:"toggle"`
	Context  context.Context `json:"context"`
}

func readyHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status": "ok",
	})
}
func isEnabledHandler(c *gin.Context) {
	var json FeatureRequestBody
	if err := c.ShouldBindJSON(&json); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"name": json.Toggle,
		"enabled": unleash.IsEnabled(json.Toggle, unleash.WithContext(json.Context)),
		"context": json.Context,
	})
}

func variantHandler(c *gin.Context) {
	var json FeatureRequestBody
	if err := c.ShouldBindJSON(&json); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"name": json.Toggle,
		"enabled": unleash.GetVariant(json.Toggle, unleash.WithVariantContext(json.Context)),
		"context": json.Context,
	})
}


func main() {
	r := gin.Default()
	r.GET("/ready", readyHandler)
	r.POST("/is-enabled", isEnabledHandler)
	r.POST("/variant", variantHandler)
	r.Run(":" +  port)
}


func init() {
	unleash.Initialize(
		unleash.WithListener(&unleash.DebugListener{}),
		unleash.WithAppName("go-test-server"),
		unleash.WithUrl(API_URL),
		unleash.WithCustomHeaders(http.Header{"Authorization": {API_KEY}}),
	)
}

func getenv(key, fallback string) string {
	value := os.Getenv(key)
	if len(value) == 0 {
		return fallback
	}
	return value
}
