// envoi.js v3 — ajoute une alerte visible et un arrêt d'urgence (timeout)
const boutonEnvoyer = document.getElementById("envoyer");
let enEnvoi = false;

async function envoyerVoix() {
  if (enEnvoi) { return; }
  if (!morceaux || morceaux.length === 0) {
    alert("Aucun enregistrement. Appuie sur le micro d'abord.");
    return;
  }
  enEnvoi = true;
  boutonEnvoyer.disabled = true;
  etat.textContent = "Envoi en cours...";

  const type = String(enregistreur.mimeType || "audio/webm");
  let ext = "webm";
  if (type.indexOf("mp4") >= 0) { ext = "mp4"; }
  if (type.indexOf("ogg") >= 0) { ext = "ogg"; }

  const fichier = new Blob(morceaux, { type: type });
  const formulaire = new FormData();
  formulaire.append("fileId", "unique()");
  formulaire.append("file", fichier, "voix-" + Date.now() + "." + ext);

  const url = ADRESSE + "/storage/buckets/" + BUCKET + "/files";

  // Sécurité : si le serveur ne répond pas en 15 secondes, on arrête tout.
  const controleur = new AbortController();
  const minuterie = setTimeout(() => controleur.abort(), 15000);

  try {
    const reponse = await fetch(url, {
      method: "POST",
      headers: { "X-Appwrite-Project": PROJET },
      body: formulaire,
      signal: controleur.signal
    });
    clearTimeout(minuterie);

    const texte = await reponse.text();

    if (!reponse.ok) {
      let message = "Code HTTP " + reponse.status + " — " + texte;
      try {
        const json = JSON.parse(texte);
        if (json && json.message) { message = "Code " + reponse.status + " : " + json.message; }
      } catch (ignore) {}
      throw new Error(message);
    }

    const donnees = JSON.parse(texte);
    localStorage.setItem("voixId", donnees["$id"]);
    etat.textContent = "Ta voix est enregistrée. Merci !";
    boutonEnvoyer.textContent = "Envoyée ✓";
    alert("SUCCÈS : Ta voix est enregistrée sur Appwrite !");
    
  } catch (e) {
    clearTimeout(minuterie);
    boutonEnvoyer.disabled = false;
    if (e.name === "AbortError") {
      etat.textContent = "Impossible : le serveur ne répond pas.";
      alert("ÉCHEC : Le serveur a mis plus de 15 secondes à répondre. (Problème de connexion ?)");
    } else {
      etat.textContent = "Impossible : " + e.message;
      alert("ÉCHEC : " + e.message);
    }
  }
  enEnvoi = false;
}

boutonEnvoyer.addEventListener("click", envoyerVoix);
