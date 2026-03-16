import type { Plant, SensorReading, CareLog, Recommendation } from '../db/queries';

function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Online agent — calls Claude API for richer plant care analysis.
 * Runs periodically when the device has network connectivity.
 */
export async function getClaudeRecommendation(
  plant: Plant,
  recentReadings: SensorReading[],
  recentCareLogs: CareLog[],
): Promise<Omit<Recommendation, 'acted_on' | 'created_at'> | null> {
  const apiKey = import.meta.env.PUBLIC_ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  // Build context from sensor data
  const moistureValues = recentReadings
    .filter(r => r.moisture !== null)
    .map(r => `${r.moisture}% (${r.timestamp})`)
    .slice(0, 14)
    .join(', ');

  const tempValues = recentReadings
    .filter(r => r.temperature !== null)
    .map(r => `${r.temperature}°C (${r.timestamp})`)
    .slice(0, 14)
    .join(', ');

  const careHistory = recentCareLogs
    .map(l => `${l.action}${l.notes ? ': ' + l.notes : ''} (${l.created_at})`)
    .slice(0, 10)
    .join('; ');

  const prompt = `You are a plant care advisor for a smart plant monitoring system called Plantgotchi.

Plant: ${plant.name} (${plant.species || 'unknown species'})
Light preference: ${plant.light_preference}
Moisture range: ${plant.moisture_min}%-${plant.moisture_max}%
Temperature range: ${plant.temp_min}°C-${plant.temp_max}°C

Recent moisture readings: ${moistureValues || 'none'}
Recent temperature readings: ${tempValues || 'none'}
Recent care actions: ${careHistory || 'none'}

Based on this data, provide ONE short actionable recommendation (1-2 sentences max). Focus on the most important thing the plant owner should do right now. If everything looks healthy, say so briefly.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 150,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      console.error('Claude API error:', response.status);
      return null;
    }

    const data = await response.json();
    const message = data.content?.[0]?.text;
    if (!message) return null;

    // Determine severity based on content
    const lowerMessage = message.toLowerCase();
    const severity: 'info' | 'warning' | 'urgent' =
      lowerMessage.includes('immediately') || lowerMessage.includes('urgent') ? 'urgent' :
      lowerMessage.includes('should') || lowerMessage.includes('consider') || lowerMessage.includes('watch') ? 'warning' :
      'info';

    return {
      id: generateId(),
      plant_id: plant.id,
      source: 'claude',
      message,
      severity,
    };
  } catch (error) {
    console.error('Failed to get Claude recommendation:', error);
    return null;
  }
}

/**
 * Run the online agent for a specific plant.
 * Fetches recent data from the DB and generates a Claude recommendation.
 */
export async function runOnlineAgent(plantId: string): Promise<void> {
  const { getPlant, getRecentReadings, getCareLogs, addRecommendation } = await import('../db/queries');

  const plant = await getPlant(plantId);
  if (!plant) return;

  const readings = await getRecentReadings(plantId, 7);
  const careLogs = await getCareLogs(plantId, 10);

  const rec = await getClaudeRecommendation(plant, readings, careLogs);
  if (rec) {
    await addRecommendation(rec);
  }
}
