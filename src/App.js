import { useState, useEffect } from 'react';
import './App.css';
import Header from './Header';
import Recherche from './Recherche';
import LigneBus from './LigneBus';
import DetailLigne from './DetailLigne';
import Footer from './Footer';
import Carte from './Carte';

function App() {
 
  // 1. Trois etats
  const [lignes, setLignes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState("");
  const [ligneSelectionnee, setLigneSelectionnee] = useState(null);
  const [nbRecherches, setNbRecherches] = useState(0); // ← (Exo 3 - Lab5) : nouvel état
  // ========== (Exo 3 - Lab5) : début — chargementDetail pour le fetch au clic ==========
  const [chargementDetail, setChargementDetail] = useState(false);
  // ========== (Exo 3 - Lab5) : fin ==========
 
  // ========== (Exo 1 - Lab5) : début — fonction extraite pour le bouton Recharger ==========
  function chargerLignes() {
    setChargement(true);
    setErreur(null);
    fetch("http://localhost:5000/lignes")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erreur serveur : " + response.status);
        }
        return response.json();
      })
      .then((data) => {
        setLignes(data);
        setChargement(false);
      })
      .catch((error) => {
        setErreur(error.message);
        setChargement(false);
      });
  }
  // ========== (Exo 1 - Lab5) : fin ==========
 
  // 2. Charger les donnees au demarrage
  useEffect(() => {
    chargerLignes(); // ← (Exo 1 - Lab5) : appel de la fonction extraite
  }, []);
 
  // 3. Le reste ne change pas (filtre, clic, etc.)
  const lignesFiltrees = lignes.filter(l =>
    l.depart.toLowerCase().includes(recherche.toLowerCase()) ||
    l.arrivee.toLowerCase().includes(recherche.toLowerCase()) ||
    l.numero.includes(recherche)
  );
 
  // ========== (Exo 3 - Lab5) : début — compteur de recherches ==========
  function handleRecherche(valeur) {
    setRecherche(valeur);
    setNbRecherches(n => n + 1);
  }
  // ========== (Exo 3 - Lab5) : fin ==========
 
  // ========== (Exo 2 - Lab5) : début — fetch au clic vers /lignes/<id> ==========
  function handleClickLigne(ligne) {
    if (ligneSelectionnee && ligneSelectionnee.id === ligne.id) {
      setLigneSelectionnee(null);
      return;
    }
    setChargementDetail(true);
    fetch(`http://localhost:5000/lignes/${ligne.id}`)
      .then((response) => {
        if (!response.ok) throw new Error("Détail introuvable");
        return response.json();
      })
      .then((data) => {
        setLigneSelectionnee(data);
        setChargementDetail(false);
      })
      .catch(() => {
        setChargementDetail(false);
      });
  }
  // ========== (Exo 2 - Lab5) : fin ==========
 
// Ecran de chargement
  if (chargement) {
    return (
      <div className="App">
        <Header />
        <main className="contenu">
          <p className="message-chargement">Chargement des lignes...</p>
        </main>
      </div>
    );
  }
// Ecran d'erreur
  if (erreur) {
    return (
      <div className="App">
        <Header />
        <main className="contenu">
          <div className="message-erreur">
            <p>Impossible de charger les lignes.</p>
            <p className="erreur-detail">{erreur}</p>
            <p>Vérifiez que le serveur Flask est lancé (python api/app.py).</p>
          </div>
        </main>
      </div>
    );
  }
// Ecran normal ( inchange par rapport au Lab 3)
  return (
    <div className="App">
      <Header />
      <main className="contenu">
 
        {/* ========== (Exo 1 - Lab5) : bouton Recharger ========== */}
        <button className="btn-recharger" onClick={chargerLignes}>
          ↻ Recharger
        </button>
        {/* ========== (Exo 1 - Lab5) : fin ========== */}
 
        {/* ========== (Exo 3 - Lab5) : compteur de recherches ========== */}
        <p className="compteur-recherches">
          🔍 Vous avez effectué <strong>{nbRecherches}</strong> recherche{nbRecherches > 1 ? 's' : ''}
        </p>
        {/* ========== (Exo 3 - Lab5) : fin ========== */}
 
        {/* onChange={handleRecherche} à la place de onChange={setRecherche} */}
        <Recherche valeur={recherche} onChange={handleRecherche} />
 
        <p className="resultat-recherche">
          {lignesFiltrees.length} ligne{lignesFiltrees.length > 1 ? 's' : ''} trouvee{lignesFiltrees.length > 1 ? 's' : ''}
        </p>
 
        {lignesFiltrees.length === 0 ? (
          <div className="aucun-resultat">
            <p>😕 Aucune ligne trouvée pour "<strong>{recherche}</strong>"</p>
            <p>Essayez un autre départ ou arrivée.</p>
          </div>
        ) : (
          lignesFiltrees.map(ligne => (
            <LigneBus
              key={ligne.id}
              numero={ligne.numero}
              depart={ligne.depart}
              arrivee={ligne.arrivee}
              arrets={ligne.arrets}
              estSelectionnee={ligneSelectionnee && ligneSelectionnee.id === ligne.id}
              onClick={() => handleClickLigne(ligne)}
            />
          ))
        )}
 
        {/* ========== (Exo 2 - Lab5) : indicateur chargement détail ========== */}
        {chargementDetail && (
          <p className="message-chargement">Chargement du détail...</p>
        )}
        {/* ========== (Exo 2 - Lab5) : fin ========== */}
 
        {ligneSelectionnee && !chargementDetail && <DetailLigne ligne={ligneSelectionnee} />}
     <Carte />
     </main>
      <Footer />
    </div>
  );
}
 
export default App;