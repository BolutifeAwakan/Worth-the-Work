export const config = { runtime: 'edge' }
export default async function handler(req) {
  const { messages, systemPrompt } = await req.json()
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 400, system: systemPrompt, messages })
  })
  const data = await res.json()
  return new Response(JSON.stringify({ reply: data.content?.[0]?.text || 'Something went wrong.' }), {
    headers: { 'Content-Type': 'application/json' }
  })
}
