export async function generateFromPrompt(prompt: string) {
  const res = await fetch('/.netlify/functions/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'unknown' }));
    throw new Error('API error: ' + JSON.stringify(err));
  }

  return res.json();
}
