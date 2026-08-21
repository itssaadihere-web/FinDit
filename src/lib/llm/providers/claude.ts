export async function callClaudeAPI(
  apiKey: string,
  prompt: string,
  systemPrompt: string = 'You are a senior statutory audit AI director inspecting financial data under ISA and IFRS standards.'
): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API Call Failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || '';
}
