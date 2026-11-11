const envoyer = document.getElementById("envoyer");
let enEnvoi = false;

async function envoyerVoix() {
  if (enEnvoi) { return; }
  enEnvoi = true;
  etat.textContent = "Envoi en cours...";
  const type = String(enregistreur.mimeType);
  let ext = "webm";
  if (type.indexOf("mp4") >= 0) { ext = "mp4"; }
  if (type.indexOf("ogg") >= 0) { ext = "ogg"; }
  const fichier = new Blob(morceaux, { type: type });
  const formulaire = new FormData();
  formulaire.append("fileId", "unique()");
  formulaire.append("file", fichier, "voix-" + Date.now() + "." + ext);
  try {
    const reponse = await fetch(ADRESSE + "/storage/buckets/" + BUCKET + "/files", {
      method: "POST",
      headers: { "X-Appwrite-Project": PROJET },
      body: formulaire
    });
     if (!reponse["ok"]) {
      const texte = await reponse["text"]();
      throw new Error(reponse["status"] + " " + texte);
     }
    const donnees = await reponse["json"]();
    localStorage.setItem("voixId", donnees["$id"]);
    etat.textContent = "Ta voix est enregistrée. Merci !";
  } catch (e) {
    etat.textContent = "Impossible : " + e["message"];
  }
  enEnvoi = false;
}

envoyer.addEventListener("click", envoyerVoix);
