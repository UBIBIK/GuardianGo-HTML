// netlify/functions/calculate_route.js
const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // 파이썬 서버에 요청을 전달
  try {
    const response = await fetch("http://34.64.214.135:5000/calculate_route", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: event.body,
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error("Error fetching route from Python server:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Failed to fetch route." }),
    };
  }
};
