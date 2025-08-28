import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
const app = new Hono();
app.use('*', cors());
app.get('/health', (c) => c.json({ ok: true }));
app.get('/api/species', async (c) => {
    const url = new URL(c.req.url);
    const lat = url.searchParams.get('lat');
    const lng = url.searchParams.get('lng');
    const radiusParam = url.searchParams.get('radius');
    const nParam = url.searchParams.get('n');
    const dateParam = url.searchParams.get('date');
    if (!lat || !lng) {
        return c.json({ error: 'lat and lng are required' }, 400);
    }
    const radiusKm = Math.min(Math.max(Number(radiusParam ?? 25), 1), 200);
    const topN = Math.min(Math.max(Number(nParam ?? 25), 1), 500);
    const date = dateParam ? new Date(dateParam) : new Date();
    const month = String(date.getUTCMonth() + 1);
    const params = new URLSearchParams({
        lat,
        lng,
        radius: String(radiusKm),
        month,
        verifiable: 'true',
        quality_grade: 'research,needs_id',
        photo_license: 'any',
        per_page: String(topN),
        order: 'desc'
    });
    const endpoint = `https://api.inaturalist.org/v1/observations/species_counts?${params.toString()}`;
    const resp = await fetch(endpoint, {
        headers: {
            'Accept': 'application/json'
        }
    });
    if (!resp.ok) {
        return c.json({ error: 'upstream_error', status: resp.status }, 502);
    }
    const data = (await resp.json());
    const items = (data.results ?? []).map((r) => {
        const taxon = r.taxon || {};
        const defaultPhoto = taxon.default_photo || {};
        return {
            id: taxon.id,
            name: taxon.name,
            preferredCommonName: taxon.preferred_common_name || taxon.english_common_name || null,
            iconicTaxonName: taxon.iconic_taxon_name || null,
            photoUrl: defaultPhoto.medium_url || defaultPhoto.url || null,
            count: r.count
        };
    });
    return c.json({ items, query: { lat, lng, radiusKm, month, topN } });
});
const port = Number(process.env.PORT || 8787);
console.log(`BIMPO server listening on http://localhost:${port}`);
serve({ fetch: app.fetch, port });
//# sourceMappingURL=index.js.map