const axios = require("axios");

exports.handler = async (event) => {
  // Handle preflight requests for CORS
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
      headers: { "Content-Type": "application/json" },
    };
  }

  try {
    const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      throw new Error("Gemini API key not configured");
    }

    const payload = JSON.parse(event.body);
    if (!payload.contents || !Array.isArray(payload.contents)) {
      throw new Error("Invalid request format");
    }

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      payload,
      {
        headers: { "Content-Type": "application/json" },
        timeout: 30000, // 30 seconds timeout
      }
    );

    return {
      statusCode: 200,
      body: JSON.stringify(response.data),
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    };
  } catch (error) {
    console.error("Proxy error:", error);

    let statusCode = 500;
    let errorMessage = "Internal server error";

    if (axios.isAxiosError(error)) {
      statusCode = error.response?.status || 500;
      errorMessage =
        error.response?.data?.error?.message ||
        error.message ||
        "Request to Gemini API failed";
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      statusCode: statusCode,
      body: JSON.stringify({
        error: errorMessage,
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      }),
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    };
  }
};
