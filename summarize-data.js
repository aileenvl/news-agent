async function summarizeData(data) {
  const response = await axios.post('https://api.openai.com/v1/completions', {
      prompt: `Summarize the following data: ${JSON.stringify(data)}`,
      max_tokens: 150,
  }, {
      headers: {
          'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
      },
  });
  return response.data.choices[0].text;
}