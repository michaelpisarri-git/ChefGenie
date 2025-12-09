exports.handler = async function (event, context) {
  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers: { 'Allow': 'POST' },
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    const body = event.body ? JSON.parse(event.body) : {};
    const prompt = body.prompt;
    if (!prompt) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing prompt in request body' }) };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Server misconfigured: GEMINI_API_KEY not set' }) };
    }

    // Example: call Google Generative Language REST API (adjust model/endpoint/params as needed)
    const gResponse = await fetch(
      'https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generate',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          prompt: { text: prompt },
          maxOutputTokens: 300
        })
      }
    );

    if (!gResponse.ok) {
      const text = await gResponse.text();
      return { statusCode: gResponse.status, body: JSON.stringify({ error: 'Generative API error', details: text }) };
    }

    const json = await gResponse.json();
    return { statusCode: 200, body: JSON.stringify({ data: json }) };
  } catch (err) {
    console.error('Function error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
