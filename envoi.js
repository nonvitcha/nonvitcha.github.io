// envoi.js — envoie la voix enregistrée vers Appwrite Storage.
// Affiche le code HTTP et la réponse exacte d'Appwrite en cas d'échec.
// Chargé après le script de enregistrer.html : utilise enregistreur, morceaux, etat.

const boutonEnvoyer = document.getElementById("envoyer");
let enEnvoi = false;

async function envoyerVoix() {
  if (enEnvoi) { return; }
  if (!morceaux || morceaux.length === 0) {
    etat.textContent = "Aucun enregistrement. Appuie sur le micro d'abord.";
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
  console.log("Envoi vers :", url);
  console.log("Taille :", fichier.size, "octets — type :", type);

  try {
    const reponse = await fetch(url, {
      method: "POST",
      headers: { "X-Appwrite-Project": PROJET },
      body: formulaire
    });
    const code = reponse.status;
    const texte = await reponse.text();
    console.log("Réponse Appwrite :", code, texte);

    if (!reponse.ok) {
      let message = "Code HTTP " + code + " — " + texte;
      try {
        const json = JSON.parse(texte);
        if (json && json.message) { message = "Code HTTP " + code + " — " + json.message; }
      } catch (ignore) {}
      throw new Error(message);
    }

    const donnees = JSON.parse(texte);
    localStorage.setItem("voixId", donnees["$id"]);
    etat.textContent = "Ta voix est enregistrée. Merci !";
    boutonEnvoyer.textContent = "Envoyée ✓";
  } catch (e) {
    console.log("Erreur d'envoi :", e);
    etat.textContent = "Impossible : " + e.message;
    boutonEnvoyer.disabled = false;
  }
  enEnvoi = false;
}

boutonEnvoyer.addEventListener("click", envoyerVoix);
