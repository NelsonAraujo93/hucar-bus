/**
 * TEMPORARY. Finds Hucar Bus's Google place ID once, then this branch is
 * deleted. Returns identifiers only: place_id is the one Places value the
 * terms allow to be stored.
 */
export async function GET(): Promise<Response> {
  const key = process.env['GOOGLE_PLACES_API_KEY'];
  if (!key) {
    return Response.json({ ok: false, error: 'GOOGLE_PLACES_API_KEY missing' }, { status: 503 });
  }
  const results: Record<string, unknown> = {};
  for (const textQuery of ['Hucarbus', 'Hucar Bus Lanzarote', 'Hucar Bus Arrecife']) {
    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress',
      },
      body: JSON.stringify({
        textQuery,
        locationBias: {
          circle: { center: { latitude: 29.03, longitude: -13.63 }, radius: 50000 },
        },
      }),
    });
    results[textQuery] = { status: response.status, body: await response.json().catch(() => null) };
  }
  console.info(JSON.stringify({ event: 'place_lookup', results }));
  return Response.json(results, { headers: { 'cache-control': 'no-store' } });
}
