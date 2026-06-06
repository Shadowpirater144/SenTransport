import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'; // useMap ajouté - Exo 2 Lab 6
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './Carte.css';

// Fix obligatoire : les icônes Leaflet sont cassées avec webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Icône bleue par défaut (explicite pour éviter undefined passé à Leaflet)
const iconeDefaut = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Exo 1 Lab 6 - Icône orange pour l'arrêt le plus proche
const iconeOrange = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Calculer la distance entre 2 points GPS (km)
function calculerDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Exo 2 Lab 6 - Composant bouton pour centrer la carte sur la position utilisateur
function BoutonCentrer({ position }) {
    const map = useMap();

    function centrer() {
        if (position) {
            map.setView(position, 15);
        }
    }

    if (!position) return null;

    return (
        <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000 }}>
            <button
                onClick={centrer}
                style={{
                    padding: '8px 12px',
                    background: '#0a6e31',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontWeight: 600,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}
            >
                📍 Centrer sur ma position
            </button>
        </div>
    );
}

function Carte() {
    const [arrets, setArrets] = useState([]);
    const [positionUtilisateur, setPositionUtilisateur] = useState(null);
    const [arretProche, setArretProche] = useState(null);
    const [troisProches, setTroisProches] = useState([]); // Exo 3 Lab 6

    const DAKAR = [14.6928, -17.4467];

    // Charger les arrêts depuis Flask
    useEffect(() => {
        fetch("http://localhost:5000/arrets")
            .then(r => r.json())
            .then(data => setArrets(data))
            .catch(err => console.error("Erreur arrets :", err));
    }, []);

    // Géolocalisation
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                pos => {
                    setPositionUtilisateur([
                        pos.coords.latitude,
                        pos.coords.longitude
                    ]);
                },
                () => console.log("Geolocalisation refusee")
            );
        }
    }, []);

    // Exo 3 Lab 6 - Trouver les 3 arrêts les plus proches (au lieu d'un seul)
    useEffect(() => {
        if (positionUtilisateur && arrets.length > 0) {
            const arretsAvecDistance = arrets.map(a => ({
                ...a,
                distance: calculerDistance(
                    positionUtilisateur[0],
                    positionUtilisateur[1],
                    a.lat,
                    a.lon
                )
            }));

            arretsAvecDistance.sort((a, b) => a.distance - b.distance);
            setArretProche(arretsAvecDistance[0]);
            setTroisProches(arretsAvecDistance.slice(0, 3)); // Exo 3 Lab 6
        }
    }, [positionUtilisateur, arrets]);

    return (
        <div className="carte-container">
            <h2 className="carte-titre">Carte des arrêts</h2>

            {/* Exo 3 Lab 6 - Afficher les 3 arrêts les plus proches */}
            {troisProches.length > 0 && (
                <div className="arrets-proches-liste">
                    <h3 className="arrets-proches-titre">Les 3 arrêts les plus proches</h3>
                    {troisProches.map((a, index) => (
                        <p key={a.id} className="arret-proche">
                            {index + 1}. <strong>{a.nom}</strong> — {a.distance.toFixed(1)} km
                        </p>
                    ))}
                </div>
            )}

            <MapContainer center={DAKAR} zoom={13} className="carte">
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap"
                />

                {/* Exo 2 Lab 6 - Bouton centrer sur ma position */}
                <BoutonCentrer position={positionUtilisateur} />

                {/* Exo 1 Lab 6 - Marqueur orange pour l'arrêt le plus proche, bleu pour les autres */}
                {arrets
                    .filter(a => a.lat != null && a.lon != null)
                    .map(a => (
                        <Marker
                            key={a.id}
                            position={[a.lat, a.lon]}
                            icon={arretProche && arretProche.id === a.id ? iconeOrange : iconeDefaut}
                        >
                            <Popup>
                                <strong>{a.nom}</strong>
                                <br />
                                Lignes : {(a.lignes || []).join(", ")}
                            </Popup>
                        </Marker>
                    ))}

                {positionUtilisateur && (
                    <Marker position={positionUtilisateur} icon={iconeDefaut}>
                        <Popup>Vous êtes ici</Popup>
                    </Marker>
                )}
            </MapContainer>
        </div>
    );
}

export default Carte;