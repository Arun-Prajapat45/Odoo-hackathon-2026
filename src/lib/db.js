export async function executeQuery(query, args = []) {
  const url = 'https://paced-nearest-prelaunch.ngrok-free.dev/query';
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, args }),
      cache: 'no-store', // always fetch fresh data
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Database Query Error:', error);
    throw error;
  }
}
