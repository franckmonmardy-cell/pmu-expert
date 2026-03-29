const https = require('https');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const today = new Date();
  const dd = String(today.getDate()).padStart(2,'0');
  const mm = String(today.getMonth()+1).padStart(2,'0');
  const yyyy = today.getFullYear();
  const dateParam = req.query.date || `${dd}${mm}${yyyy}`;
  const dateFr = `${dateParam.substring(0,2)}/${dateParam.substring(2,4)}/${dateParam.substring(4,8)}`;

  // Essai 1 : API PMU officielle offline
  try {
    const data = await callAPI('offline.turfinfo.api.pmu.fr', `/rest/client/7/programme/${dateParam}`);
    if (data && data.programme && data.programme.reunions) {
      res.setHeader('Cache-Control', 's-maxage=120');
      return res.status(200).json(data);
    }
  } catch(e) { console.log('offline failed:', e.message); }

  // Essai 2 : API PMU online
  try {
    const data = await callAPI('online.turfinfo.api.pmu.fr', `/rest/client/7/programme/${dateParam}`);
    if (data && data.programme && data.programme.reunions) {
      res.setHeader('Cache-Control', 's-maxage=120');
      return res.status(200).json(data);
    }
  } catch(e) { console.log('online failed:', e.message); }

  // Essai 3 : Open-PMU-API (données historiques)
  try {
    const data = await callAPI('open-pmu-api.vercel.app', `/api/arrivees?date=${encodeURIComponent(dateFr)}`);
    if (data && !data.error && data.message && data.message.length > 0) {
      const converted = convertFormat(data.message, dateParam);
      res.setHeader('Cache-Control', 's-maxage=300');
      return res.status(200).json(converted);
    }
  } catch(e) { console.log('open-pmu failed:', e.message); }

  // Si tout échoue : données de démonstration
  return res.status(200).json(getDemoData(dateParam));
};

function callAPI(host, path) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: host, port: 443, path, method: 'GET',
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Origin': 'https://www.pmu.fr',
        'Referer': 'https://www.pmu.fr/turf/'
      }
    }, (response) => {
      const chunks = [];
      response.on('data', c => chunks.push(c));
      response.on('end', () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
        catch(e) { reject(new Error('Parse error')); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.end();
  });
}

function convertFormat(courses, date) {
  const reunions = {};
  courses.forEach(c => {
    const rc = c['r/c'] || 'R1C1';
    const rNum = parseInt(rc.replace(/R(\d+)C\d+/, '$1')) || 1;
    const cNum = parseInt(rc.replace(/R\d+C(\d+)/, '$1')) || 1;
    if (!reunions[rNum]) {
      reunions[rNum] = {
        numOfficiel: rNum,
        hippodrome: { libelleCourt: c.lieu || 'Hippodrome', libelle: c.lieu || 'Hippodrome' },
        courses: []
      };
    }
    reunions[rNum].courses.push({
      numOrdre: cNum,
      libelle: c.pix || c.prix || `Course ${cNum}`,
      libelleCourt: c.pix || c.prix || `Course ${cNum}`,
      discipline: c.type || 'Plat',
      distance: c.distance || 0,
      montantPrix: c.montant || 0,
      nombreDeclaresPartants: c.partants || 0,
      heureDepart: null,
      categorieParticularite: null,
      arrivee: c.arrivee || [],
      nonPartants: c.non_partants || []
    });
  });
  return { programme: { date, reunions: Object.values(reunions) } };
}

function getDemoData(date) {
  const hippos = [
    { nom: 'Vincennes', r: 1 },
    { nom: 'Auteuil', r: 2 },
    { nom: 'Longchamp', r: 3 },
    { nom: 'Cagnes-sur-Mer', r: 4 },
    { nom: 'Saint-Cloud', r: 5 },
  ];
  const types = ['Trot Attelé', 'Trot Monté', 'Plat', 'Haies', 'Steeple'];
  const prix = ['Prix du Président', 'Prix de la Ville', 'Prix du Printemps', 'Grand Prix', 'Prix de l\'Étoile', 'Prix Maraîcher', 'Prix du Terroir'];

  const now = new Date();
  const baseTime = 10 * 60; // 10h00 en minutes

  return {
    programme: {
      date,
      reunions: hippos.map((h, hi) => ({
        numOfficiel: h.r,
        hippodrome: { libelleCourt: h.nom, libelle: h.nom },
        courses: Array.from({ length: 7 }, (_, ci) => ({
          numOrdre: ci + 1,
          libelle: prix[ci % prix.length],
          libelleCourt: prix[ci % prix.length],
          discipline: types[hi % types.length],
          distance: [1600, 1800, 2100, 2400, 2600, 3000, 3200][ci],
          montantPrix: [15000, 20000, 25000, 30000, 40000, 50000, 80000][ci],
          nombreDeclaresPartants: [8, 10, 12, 14, 9, 11, 15][ci],
          heureDepart: (baseTime + hi * 90 + ci * 12) * 60 * 1000,
          categorieParticularite: (hi === 0 && ci === 3) ? 'QUINTE' : null,
        }))
      }))
    },
    _isDemo: true
  };
}
