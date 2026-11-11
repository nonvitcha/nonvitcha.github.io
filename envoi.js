// envoi4.js — Affiche la taille du fichier et bloque si le serveur ne répond pas
const boutonEnvoyer = document.getElementById("envoyer");
boutonEnvoyer.textContent = "Envoyer (V4)"; // Ça nous dira si le nouveau code est chargé
let enEnvoi = false;

async function envoyerVoix() {
  if (enEnvoi) { return; }
  
  // On vérifie si on a bien de l'audio
  if (!morceaux || morceaux.length === 0) {
    alert("ÉCHEC : Le fichier audio est vide. Recommence l'enregistrement.");
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
  
  // Si le fichier fait 0 octet, on s'arrête tout de suite
  if (fichier.size === 0) {
    alert("ÉCHEC : Le fichier pèse 0 octet. Le micro n'a rien capturé.");
    boutonEnvoyer.disabled = false;
    enEnvoi = false;
    return;
  }

  const formulaire = new FormData();
  formulaire.append("fileId", "unique()");
  formulaire.append("file", fichier, "voix-" + Date.now() + "." + ext);

  const url = ADRESSE + "/storage/buckets/" + BUCKET + "/files";
  const controleur = new AbortController();
  const minuterie = setTimeout(() => controleur.abort(), 15000); // 15 sec max

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
      let message = "Code " + reponse.status + " : " + texte;
      try {
        const json = JSON.parse(texte);
        if (json && json.message) { message = "Code " + reponse.status + " : " + json.message; }
      } catch (ignore) {}
      throw new Error(message);
    }

    const donnees = JSON.parse(texte);
    localStorage.setItem("voixId", donnees["$id"]);
    etat.textContent = "Ta voix est enregistrée. Merci !";
    alert("SUCCÈS : Ta voix est enregistrée !");
    
  } catch (e) {
    clearTimeout(minuterie);
    boutonEnvoyer.disabled = false;
    if (e.name === "AbortError") {
      alert("ÉCHEC : Appwrite n'a pas répondu en 15 secondes. (Problème de réseau ?)");
    } else {
      alert("ÉCHEC : " + e.message);
    }
  }
  enEnvoi = false;
}

boutonEnvoyer.addEventListener("click", envoyerVoix);
