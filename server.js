
const http = require("http");

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.OPENAI_API_KEY;

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  res.setHeader("Content-Type", "application/json");

  if (req.method === "GET" && req.url === "/") {
    return res.end(JSON.stringify({
      app: "Mɢ AI",
      status: "Server is running"
    }));
  }

  if (req.method !== "POST" || req.url !== "/chat") {
    res.writeHead(404);
    return res.end(JSON.stringify({ error: "Not found" }));
  }

  if (!API_KEY) {
    res.writeHead(500);
    return res.end(JSON.stringify({
      error: "API key is not configured"
    }));
  }

  try {
    let body = "";
    for await (const chunk of req) {
      body += chunk;
      if (body.length > 10000) {
        res.writeHead(413);
        return res.end(JSON.stringify({ error: "Message too large" }));
      }
    }

    const { message } = JSON.parse(body);

    if (typeof message !== "string" || !message.trim()) {
      res.writeHead(400);
      return res.end(JSON.stringify({ error: "Message required" }));
    }

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-5.4-mini",
          instructions: "You are Mɢ AI, a helpful assistant. Reply in the language used by the user.",
          input: message
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      res.writeHead(response.status);
      return res.end(JSON.stringify({
        error: "AI service error"
      }));
    }

    const answer = (data.output || [])
      .flatMap(item => item.content || [])
      .filter(item => item.type === "output_text")
      .map(item => item.text)
      .join("\n");

    return res.end(JSON.stringify({ answer }));

  } catch (error) {
    res.writeHead(500);
    return res.end(JSON.stringify({
      error: "Server error"
    }));
  }
});

server.listen(PORT, () => {
  console.log(`Mɢ AI running on port ${PORT}`);
});
