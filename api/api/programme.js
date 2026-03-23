const https = require('https');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const today = new Date();
  const date = req.query.date ||
    `${String(today.getDate()).padStart(2,'0')}${String(today.getMonth()+1).padStart(2,'0')}${today.getFullYear()}`;

  try {
    const data = await apiCall(`/rest/client/7/programme/${date}`);
    res.setHeader('Cache-Control', 's-maxage=120');
    return res.status(200).json(data);
  } catch(e) {
    // Fallback: essayer online
    try {
      const data2 = await apiCall2(`/rest/client/61/programme/${date}`);
      return res.status(200).json(data2);
    } catch(e2) {
      return res.status(500).json({ error: e2.message });
    }
  }
};

function apiCall(path) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'offline.turfinfo.api.pmu.fr',
      port: 443, path, method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10)',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'fr-FR,fr;q=0.9',
        'Origin': 'https://www.pmu.fr',
        'Referer': 'https://www.pmu.fr/'
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { reject(new Error('Parse error: '+data.substring(0,200))); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function apiCall2(path) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'online.turfinfo.api.pmu.fr',
      port: 443, path, method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10)',
        'Accept': 'application/json',
        'Origin': 'https://www.pmu.fr',
        'Referer': 'https://www.pmu.fr/'
      }
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
