import json
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask import Flask, jsonify, request

app = Flask(__name__)
CORS(app)

# Charger les données depuis le fichier JSON au démarrage
with open("lignes_ddd.json", "r") as f:
    lignes = json.load(f)

with open("arrets.json", "r") as f:
    arrets = json.load(f)


# ─── Endpoints de base ────────────────────────────────────────────────────────

@app.route("/")
def accueil():
    return jsonify({
        "message": "Bienvenue sur l'API SenTransport !",
        "endpoints": ["/lignes", "/lignes/<id>", "/arrets", "/stats", "/lignes/recherche?q="]
    })


@app.route("/lignes")
def get_lignes():
    return jsonify(lignes)


@app.route("/lignes/<int:ligne_id>")
def get_ligne(ligne_id):
    ligne = next(
        (l for l in lignes if l["id"] == ligne_id),
        None
    )
    if ligne is None:
        return jsonify({"erreur": "Ligne non trouvee"}), 404
    return jsonify(ligne)


# ─── Exercice 1 : tous les arrêts sans doublons ───────────────────────────────

@app.route("/arrets")
def get_arrets():
    return jsonify(arrets)


# ─── Exercice 2 : statistiques ────────────────────────────────────────────────

@app.route("/stats")
def get_stats():
    nb_lignes = len(lignes)
    total_arrets = sum(l["arrets"] for l in lignes)
    ligne_max = max(lignes, key=lambda l: l["arrets"])
    return jsonify({
        "nombre_total_lignes": nb_lignes,
        "nombre_total_arrets": total_arrets,
        "ligne_plus_darrets": {
            "numero": ligne_max["numero"],
            "arrets": ligne_max["arrets"],
            "depart": ligne_max["depart"],
            "arrivee": ligne_max["arrivee"]
        }
    })


# ─── Exercice 3 : recherche par nom d'arrêt/départ/arrivée ───────────────────

@app.route("/lignes/recherche")
def recherche_lignes():
    q = request.args.get("q", "").lower()
    if not q:
        return jsonify({"erreur": "Parametre 'q' manquant"}), 400
    resultats = [
        l for l in lignes
        if q in l["depart"].lower() or q in l["arrivee"].lower()
    ]
    return jsonify(resultats)


# ─── L'ajouter l'endpoint ─────────────────────────────────────────────────────

incidents = []

@app.route("/incidents", methods=["GET"])
def get_incidents():
    return jsonify(incidents)

@app.route("/incidents", methods=["POST"])
def post_incident():
    data = request.get_json()
    if not data or "ligne" not in data or "description" not in data:
        return jsonify({"erreur": "Champs requis manquants"}), 400
    incident = {
        "id": len(incidents) + 1,
        "ligne": data["ligne"],
        "description": data["description"],
        "lieu": data.get("lieu", "Non precise"),
    }
    incidents.append(incident)
    return jsonify(incident), 201


#─── Lancement  ───

if __name__ == "__main__":
    app.run(debug=True, port=5000)