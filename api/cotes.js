const https = require('https');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { date, reunion, course } = req.query;
  if (!date || !reunion || !course) {
    return res.status(400).json({ error: 'date, reunion, course requis' });
  }

  try {
    const data = await apiCall(`/rest/client/7/programme/${date}/${reunion}/${course}/citations?paris=E_SIMPLE_GAGNANT`);
    res.setHeader('Cache-Control', 's-maxage=30');
    return res.status(200).json(data);
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
};

function apiCall(path) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'offline.turfinfo.api.pmu.fr',
      port: 443, path, method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { reject(new Error('Parse error')); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}
