
exports.handler = async function (event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Méthode non autorisée.' }),
    };
  }

  try {
    const payload = JSON.parse(event.body);
    const query = (payload.query || '').trim();
    const emailInput = (payload.email || '').trim();
    const phoneInput = (payload.telephone || '').trim();
    const ibanInput = (payload.iban || '').trim();
    const prenomInput = (payload.prenom || '').trim();
    const nomFamilleInput = (payload.nom_famille || '').trim();
    const adresseInput = (payload.adresse || '').trim();
    
    // Votre clé API fournie
    const REAL_API_KEY = "brix_p1uv7FoilAQ47NUg-S8qz6HWqm2SSCCKEAr9ltLys-V6KQSV";
    const BASE_URL = "https://brixhub.net/api/v1";

    const commonHeaders = {
      "X-API-Key": REAL_API_KEY,
      "Content-Type": "application/json",
      "User-Agent": "GZDataConsole/2.0"
    };

    let responseData = null;
    let httpStatus = 200;

    // Routage intelligent des critères structurés
    if (emailInput) {
      const res = await fetch(`${BASE_URL}/lookup/email/${encodeURIComponent(emailInput)}`, {
        method: 'GET',
        headers: commonHeaders
      });
      httpStatus = res.status;
      responseData = await res.json();
    } else if (phoneInput) {
      const cleanPhone = phoneInput.replace(/[\s.-]/g, '');
      const res = await fetch(`${BASE_URL}/lookup/phone/${encodeURIComponent(cleanPhone)}`, {
        method: 'GET',
        headers: commonHeaders
      });
      httpStatus = res.status;
      responseData = await res.json();
    } else if (ibanInput) {
      const cleanIban = ibanInput.replace(/\s/g, '');
      const res = await fetch(`${BASE_URL}/lookup/iban/${encodeURIComponent(cleanIban)}`, {
        method: 'GET',
        headers: commonHeaders
      });
      httpStatus = res.status;
      responseData = await res.json();
    } else if (adresseInput) {
      const res = await fetch(`${BASE_URL}/search`, {
        method: 'POST',
        headers: commonHeaders,
        body: JSON.stringify({
          flexible: true,
          adresse: adresseInput,
          per_page: 10
        })
      });
      httpStatus = res.status;
      responseData = await res.json();
    } else if (prenomInput || nomFamilleInput) {
      const searchBody = {
        flexible: true,
        per_page: 10
      };
      if (prenomInput) searchBody.prenom = prenomInput;
      if (nomFamilleInput) searchBody.nom_famille = nomFamilleInput;

      const res = await fetch(`${BASE_URL}/search`, {
        method: 'POST',
        headers: commonHeaders,
        body: JSON.stringify(searchBody)
      });
      httpStatus = res.status;
      responseData = await res.json();
    } else if (query) {
      // Routage historique (Query unique)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^(?:(?:\+|00)33|0)[1-9](?:[\s.-]*\d{2}){4}$/;
      const ibanRegex = /^FR\d{2}[A-Z0-9]{4}\d{4}[A-Z0-9]{11}\d{2}$/i;
      const addressRegex = /(?:\d+\s+)?(?:RUE|AVENUE|CITE|CITÉ|BOULEVARD|ROUTE|CHEMIN|IMPASSE|ALLÉE|ALLEE|SQUARE|PLACE|VILLA|RESIDENCE|RÉSIDENCE|IMP\.|AV\.|BD\.|ALL\.)/i;

      if (emailRegex.test(query)) {
        const res = await fetch(`${BASE_URL}/lookup/email/${encodeURIComponent(query)}`, {
          method: 'GET',
          headers: commonHeaders
        });
        httpStatus = res.status;
        responseData = await res.json();
      } else if (phoneRegex.test(query)) {
        const cleanPhone = query.replace(/[\s.-]/g, '');
        const res = await fetch(`${BASE_URL}/lookup/phone/${encodeURIComponent(cleanPhone)}`, {
          method: 'GET',
          headers: commonHeaders
        });
        httpStatus = res.status;
        responseData = await res.json();
      } else if (ibanRegex.test(query.replace(/\s/g, ''))) {
        const cleanIban = query.replace(/\s/g, '');
        const res = await fetch(`${BASE_URL}/lookup/iban/${encodeURIComponent(cleanIban)}`, {
          method: 'GET',
          headers: commonHeaders
        });
        httpStatus = res.status;
        responseData = await res.json();
      } else if (addressRegex.test(query)) {
        const res = await fetch(`${BASE_URL}/search`, {
          method: 'POST',
          headers: commonHeaders,
          body: JSON.stringify({
            flexible: true,
            adresse: query,
            per_page: 10
          })
        });
        httpStatus = res.status;
        responseData = await res.json();
      } else {
        const parts = query.split(/\s+/);
        const searchBody = {
          flexible: true,
          per_page: 10
        };

        if (parts.length >= 2) {
          searchBody.prenom = parts[0];
          searchBody.nom_famille = parts.slice(1).join(' ');
        } else {
          searchBody.nom_famille = query;
        }

        const res = await fetch(`${BASE_URL}/search`, {
          method: 'POST',
          headers: commonHeaders,
          body: JSON.stringify(searchBody)
        });
        httpStatus = res.status;
        responseData = await res.json();
      }
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Aucun paramètre de recherche fourni.' }),
      };
    }

    // Extraction et reformatage pour le graphe de relations GZ Data
    let results = [];
    if (responseData && responseData.data) {
      // Si c'est un tableau de résultats
      if (Array.isArray(responseData.data.results)) {
        results = responseData.data.results;
      } else if (responseData.data.results) {
        results = [responseData.data.results];
      } else if (responseData.data) {
        // Pour les lookups simples qui renvoient un seul objet
        results = [responseData.data];
      }
    }

    // Mapper tous les profils trouvés pour le graphe et l'interface
    const formattedResults = results.map(rawProfile => {
      const details = {};
      if (rawProfile.nom_famille) details["Nom"] = rawProfile.nom_famille;
      if (rawProfile.prenom) details["Prénom"] = rawProfile.prenom;
      if (rawProfile.nom_naissance) details["Nom naissance"] = rawProfile.nom_naissance;
      if (rawProfile.civilite) details["Civilité"] = rawProfile.civilite;
      if (rawProfile.genre) details["Genre"] = rawProfile.genre;
      if (rawProfile.date_naissance) details["Naissance"] = rawProfile.date_naissance;
      if (rawProfile.email) details["Email"] = rawProfile.email;
      if (rawProfile.telephone) details["Téléphone"] = rawProfile.telephone;
      if (rawProfile.mobile) details["Mobile"] = rawProfile.mobile;
      if (rawProfile.adresse) details["Adresse"] = rawProfile.adresse;
      if (rawProfile.complement_adresse) details["Complément adresse"] = rawProfile.complement_adresse;
      if (rawProfile.code_postal) details["Code postal"] = rawProfile.code_postal;
      if (rawProfile.ville) details["Ville"] = rawProfile.ville;
      if (rawProfile.pays) details["Pays"] = rawProfile.pays;
      if (rawProfile.lieu_naissance) details["Lieu naissance"] = rawProfile.lieu_naissance;
      if (rawProfile.nom_affichage) details["Nom affiché"] = rawProfile.nom_affichage;
      if (rawProfile.nom_utilisateur) details["Username"] = rawProfile.nom_utilisateur;
      if (rawProfile.nir) details["NIR"] = rawProfile.nir;
      if (rawProfile.societe) details["Société"] = rawProfile.societe;
      if (rawProfile.fonction) details["Fonction"] = rawProfile.fonction;

      const connections = [];
      if (rawProfile.email) connections.push({ label: "Email", value: rawProfile.email });
      if (rawProfile.telephone) connections.push({ label: "Téléphone", value: rawProfile.telephone });
      if (rawProfile.mobile) connections.push({ label: "Mobile", value: rawProfile.mobile });
      if (rawProfile.adresse) connections.push({ label: "Adresse", value: rawProfile.adresse });

      return {
        entity: rawProfile.nom_affichage || `${rawProfile.prenom || ''} ${rawProfile.nom_famille || 'Entité'}`.trim(),
        type: rawProfile.profession || rawProfile.fonction || "Enregistrement",
        confidence: rawProfile._confidence || 75,
        sources: rawProfile._sources || [],
        details: details,
        connections: connections
      };
    });

    return {
      statusCode: httpStatus,
      headers,
      body: JSON.stringify({
        status: 200,
        data: formattedResults
      })
    };

  } catch (error) {
    console.error("Erreur proxy GZ:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Erreur lors du requêtage GZ Data.' }),
    };
  }
};
