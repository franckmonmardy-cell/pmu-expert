
const https = require('https');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const date = req.query.date || getTodayStr();

  // Try multiple PMU API endpoints
  const urls = [
    `https://offline.turfinfo.api.pmu.fr/rest/client/7/programme/${date}`,
    `https://turfinfo.api.pmu.fr/rest/client/7/programme/${date}`,
    `https://www.pmu.fr/turf/rest/client/7/programme/${date}`,
  ];

  for (const url of urls) {
    try {
      const data = await fetchUrl(url);
      if (data && data.programme && data.programme.reunions) {
        return res.status(200).json(data);
      }
    } catch(e) {
      continue;
    }
  }

  // Return demo data if all APIs fail
  return res.status(200).json(getDemoData());
};

function getTodayStr() {
  const d = new Date();
  return String(d.getDate()).padStart(2,'0') +
         String(d.getMonth()+1).padStart(2,'0') +
         d.getFullYear();
}

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json'
      },
      timeout: 8000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { reject(new Error('Parse error')); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function getDemoData() {
  const now = new Date();
  const nm = now.getHours() * 60 + now.getMinutes();
  const base = now.getTime();

  return {
    programme: {
      reunions: [
        {
          numOfficiel: 1,
          hippodrome: { libelleCourt: 'LONGCHAMP', libelle: 'Hippodrome de Longchamp' },
          courses: [
            { numOrdre: 1, libelle: 'PRIX DE DIANE', discipline: 'PLAT', distance: 2100, heureDepart: base + 30*60000, nombreDeclaresPartants: 14, categorieParticularite: 'QUINTE', montantPrix: 300000 },
            { numOrdre: 2, libelle: 'PRIX ROYAL OAK', discipline: 'PLAT', distance: 3100, heureDepart: base + 90*60000, nombreDeclaresPartants: 12, categorieParticularite: null, montantPrix: 150000 },
            { numOrdre: 3, libelle: 'PRIX MORNY', discipline: 'PLAT', distance: 1200, heureDepart: base + 150*60000, nombreDeclaresPartants: 9, categorieParticularite: null, montantPrix: 120000 },
          ]
        },
        {
          numOfficiel: 2,
          hippodrome: { libelleCourt: 'VINCENNES', libelle: 'Hippodrome de Vincennes' },
          courses: [
            { numOrdre: 1, libelle: 'GRAND PRIX DE PARIS', discipline: 'TROT', distance: 2700, heureDepart: base - 30*60000, nombreDeclaresPartants: 10, categorieParticularite: null, montantPrix: 200000 },
            { numOrdre: 2, libelle: 'PRIX DE PARIS', discipline: 'TROT', distance: 2100, heureDepart: base - 60*60000, nombreDeclaresPartants: 13, categorieParticularite: null, montantPrix: 100000 },
            { numOrdre: 3, libelle: 'PRIX CAMILLE', discipline: 'TROT', distance: 1700, heureDepart: base + 60*60000, nombreDeclaresPartants: 11, categorieParticularite: null, montantPrix: 80000 },
          ]
        },
        {
          numOfficiel: 3,
          hippodrome: { libelleCourt: 'CHANTILLY', libelle: 'Hippodrome de Chantilly' },
          courses: [
            { numOrdre: 1, libelle: 'PRIX JOCKEY CLUB', discipline: 'PLAT', distance: 2400, heureDepart: base + 120*60000, nombreDeclaresPartants: 16, categorieParticularite: null, montantPrix: 500000 },
            { numOrdre: 2, libelle: 'PRIX SAINT-ALARY', discipline: 'PLAT', distance: 2000, heureDepart: base + 180*60000, nombreDeclaresPartants: 13, categorieParticularite: null, montantPrix: 250000 },
          ]
        },
        {
          numOfficiel: 4,
          hippodrome: { libelleCourt: 'AUTEUIL', libelle: 'Hippodrome d\'Auteuil' },
          courses: [
            { numOrdre: 1, libelle: 'PRIX DE LA FORET', discipline: 'OBSTACLE', distance: 3200, heureDepart: base - 90*60000, nombreDeclaresPartants: 11, categorieParticularite: null, montantPrix: 180000 },
            { numOrdre: 2, libelle: 'PRIX DU CADRAN', discipline: 'HAIES', distance: 4000, heureDepart: base + 240*60000, nombreDeclaresPartants: 8, categorieParticularite: null, montantPrix: 90000 },
          ]
        }
      ]
    }
  };
}
