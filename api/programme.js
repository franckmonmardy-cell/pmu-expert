module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const date = req.query.date || getTodayStr();

  // Try PMU API
  try {
    const data = await fetchPMU(date);
    if (data?.programme?.reunions?.length > 0) {
      return res.status(200).json(data);
    }
  } catch(e) {}

  // Always return demo data as fallback
  return res.status(200).json(getDemoData());
};

function getTodayStr() {
  const d = new Date();
  return String(d.getDate()).padStart(2,'0') +
         String(d.getMonth()+1).padStart(2,'0') +
         d.getFullYear();
}

function fetchPMU(date) {
  const https = require('https');
  const url = `https://offline.turfinfo.api.pmu.fr/rest/client/7/programme/${date}`;
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {'User-Agent':'Mozilla/5.0','Accept':'application/json'},
      timeout: 5000
    }, (r) => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function getDemoData() {
  const b = Date.now();
  return {
    programme: {
      reunions: [
        {
          numOfficiel: 1,
          hippodrome: { libelleCourt: 'LONGCHAMP' },
          courses: [
            { numOrdre: 1, libelle: 'PRIX DE DIANE', discipline: 'PLAT', distance: 2100, heureDepart: b+30*60000, nombreDeclaresPartants: 14, categorieParticularite: 'QUINTE', montantPrix: 300000 },
            { numOrdre: 2, libelle: 'PRIX ROYAL OAK', discipline: 'PLAT', distance: 3100, heureDepart: b+90*60000, nombreDeclaresPartants: 12, categorieParticularite: null, montantPrix: 150000 },
            { numOrdre: 3, libelle: 'PRIX MORNY', discipline: 'PLAT', distance: 1200, heureDepart: b+150*60000, nombreDeclaresPartants: 9, categorieParticularite: null, montantPrix: 120000 },
            { numOrdre: 4, libelle: 'PRIX LUPIN', discipline: 'PLAT', distance: 1800, heureDepart: b-45*60000, nombreDeclaresPartants: 11, categorieParticularite: null, montantPrix: 90000 },
          ]
        },
        {
          numOfficiel: 2,
          hippodrome: { libelleCourt: 'VINCENNES' },
          courses: [
            { numOrdre: 1, libelle: 'GRAND PRIX DE PARIS', discipline: 'TROT', distance: 2700, heureDepart: b-30*60000, nombreDeclaresPartants: 10, categorieParticularite: null, montantPrix: 200000 },
            { numOrdre: 2, libelle: 'PRIX CAMILLE', discipline: 'TROT', distance: 1700, heureDepart: b+60*60000, nombreDeclaresPartants: 11, categorieParticularite: null, montantPrix: 80000 },
            { numOrdre: 3, libelle: 'PRIX DE PARIS', discipline: 'ATTELE', distance: 2100, heureDepart: b+120*60000, nombreDeclaresPartants: 13, categorieParticularite: null, montantPrix: 100000 },
          ]
        },
        {
          numOfficiel: 3,
          hippodrome: { libelleCourt: 'CHANTILLY' },
          courses: [
            { numOrdre: 1, libelle: 'PRIX JOCKEY CLUB', discipline: 'PLAT', distance: 2400, heureDepart: b+180*60000, nombreDeclaresPartants: 16, categorieParticularite: null, montantPrix: 500000 },
            { numOrdre: 2, libelle: 'PRIX SAINT-ALARY', discipline: 'PLAT', distance: 2000, heureDepart: b+240*60000, nombreDeclaresPartants: 13, categorieParticularite: null, montantPrix: 250000 },
          ]
        },
        {
          numOfficiel: 4,
          hippodrome: { libelleCourt: 'AUTEUIL' },
          courses: [
            { numOrdre: 1, libelle: 'PRIX DE LA FORET', discipline: 'OBSTACLE', distance: 3200, heureDepart: b-90*60000, nombreDeclaresPartants: 11, categorieParticularite: null, montantPrix: 180000 },
            { numOrdre: 2, libelle: 'PRIX DU CADRAN', discipline: 'HAIES', distance: 4000, heureDepart: b-120*60000, nombreDeclaresPartants: 8, categorieParticularite: null, montantPrix: 90000 },
          ]
        }
      ]
    }
  };
}
