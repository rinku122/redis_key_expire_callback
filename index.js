const redis = require("redis");
const express = require("express");

// Create a Redis client
const client = redis.createClient();

const subscriber = redis.createClient();

// Handle Redis errors
client.on("error", (err) => {
  console.error("Redis error:", err);
});

// client.on("ready", function (err) {
//   if (!err) client.config("SET", "notify-keyspace-events", "Ex");
// });

subscriber.on("error", (err) => {
  console.error("Redis subscriber error:", err);
});

// Connect to Redis
client.connect().then(async () => {
  console.log("Connected to Redis");
});

subscriber.connect().then(() => {
  console.log("Connected to Redis subscriber");

  // Subscribe to key expiration events
  subscriber.subscribe("__keyevent@0__:expired", (message) => {
    console.log(`Key expired: ${message}`);
  });
});

const app = express();
app.use(express.json());

// Set key-value in Redis
app.post("/set", async (req, res) => {
  const { key, value } = req.body;
  if (!key || !value) {
    return res.status(400).send("Key and value are required");
  }
  try {
    await client.set(key, value, { EX: 60 }); // Set expiration to 60 seconds
    res.status(200).send("Key-value pair set successfully with 1 minute TTL");
  } catch (err) {
    console.log(err);
    res.status(500).send("Error setting key-value pair");
  }
});

// Get value by key from Redis
app.get("/get/:key", async (req, res) => {
  const { key } = req.params;
  try {
    const value = await client.get(key);
    if (value) {
      res.status(200).send(value);
    } else {
      res.status(404).send("Key not found");
    }
  } catch (err) {
    res.status(500).send("Error getting value");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});



//docker exec -it 78b8ce18a28b redis-cli
//CONFIG SET notify-keyspace-events Ex