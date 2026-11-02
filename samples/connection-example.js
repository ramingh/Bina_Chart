/* Template ONLY — adjust service contract to your own BINA data provider.
   The chart definition JSON NEVER includes database passwords or unrestricted SQL.
   Important: for big datasets (20M+), aggregate at server and return only chart-sized data.
   For now, getRows returns records; server should limit and/or aggregate carefully.
*/
const dataProvider = {
  async getRows(config, filters) {
    const resp = await fetch('/api/chart-data', {
      method: 'POST', credentials: 'same-origin',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({sourceId: config.dataSource.id, xFields: config.xFields,
        seriesField: config.seriesField, measures: config.measures,
        filters})
    });
    if (!resp.ok) throw Error('Unable to get chart data: ' + resp.status);
    return resp.json(); // Array of raw records, small enough to render client-side.
  },
  async getDistinctValues(field) {
    const resp = await fetch('/api/chart-values?field=' + encodeURIComponent(field), {
      credentials: 'same-origin'
    });
    if (!resp.ok) throw Error('Cannot load distinct values');
    return resp.json();
  }
};
// Enforce server-side authorization and a strict whitelist of sourceId / field names.
