import "dotenv/config";
import { createApp } from "./app.js";
import { fileURLToPath } from "node:url";

const app = createApp({
  staticDir: process.env.NODE_ENV === "production"
    ? fileURLToPath(new URL("../../frontend/dist/", import.meta.url))
    : undefined
});
const port = Number(process.env.PORT || 4000);

app.listen(port, () => {
  console.log(`AI card platform API server is running on http://localhost:${port}`);
});

