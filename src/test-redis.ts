import IORedis from "ioredis";
import "dotenv/config"; // Ensure it's loaded if bun doesn't do it automatically for some reason

async function test() {
  const url = process.env.UPSTASH_REDIS_URL;
  console.log("UPSTASH_REDIS_URL exists:", !!url);
  if (!url) return;
  
  // Log the length and first/last 5 chars to avoid exposing token but checking integrity
  console.log("Length:", url.length);
  console.log("Start:", url.substring(0, 30));
  console.log("End:", url.substring(url.length - 20));

  try {
    const redis = new IORedis(url);
    await redis.set("test-key", "ok");
    const val = await redis.get("test-key");
    console.log("Redis test successful:", val);
    await redis.quit();
  } catch (error: any) {
    console.error("Redis test failed!");
    console.error("Error:", error.message);
    if (error.command) {
        console.error("Command:", error.command.name);
        console.error("Args:", error.command.args);
    }
  }
}

test();
