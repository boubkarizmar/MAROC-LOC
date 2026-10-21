"""
Build the MAROC-LOC RAG knowledge base.

Usage (inside marocloc-ai container):
    python scripts/build_rag_knowledge_base.py

What it does:
1. Loads approved properties from PostgreSQL.
2. Generates property cards, city guides, FAQ, and process documents.
3. Chunks and indexes them into ChromaDB collection `marocloc_kb`.
"""

import sys
import os
from collections import defaultdict

# Ensure ai-service root is on path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.postgres_store import postgres_store
from services.rag_service import get_rag_pipeline
from core.config import settings


def _amenity_list(prop: dict) -> list:
    amenities = []
    mapping = {
        "furnished": "meublé",
        "has_air_conditioning": "climatisation",
        "has_balcony": "balcon",
        "has_elevator": "ascenseur",
        "has_garden": "jardin",
        "has_parking": "parking",
        "has_pool": "piscine",
        "has_security": "sécurité",
        "has_internet": "internet",
        "garden_view": "vue jardin",
        "modern_area": "quartier moderne",
        "family_area": "quartier familial",
        "popular_area": "quartier prisé",
        "city_center": "centre-ville",
        "near_school": "près des écoles",
        "near_university": "près d'une université",
        "near_hospital": "près d'un hôpital",
        "near_mosque": "près d'une mosquée",
        "near_market": "près d'un marché",
        "near_train_station": "près de la gare",
        "near_tram": "près du tram",
        "near_bus": "près des bus",
        "pet_allowed": "animaux acceptés",
    }
    for key, label in mapping.items():
        if prop.get(key):
            amenities.append(label)
    return amenities


def build_property_document(prop: dict) -> dict:
    """Create a rich searchable document for a single property."""
    pid = str(prop.get("id", ""))
    title = prop.get("title", "") or "Propriété"
    description = prop.get("description", "") or ""
    city = prop.get("city", "")
    category = prop.get("category", "")
    ptype = prop.get("type", "")
    price = prop.get("price", 0)
    surface = prop.get("surface", 0)
    rooms = prop.get("rooms", 0)
    bedrooms = prop.get("bedrooms", 0)
    bathrooms = prop.get("bathrooms", 0)
    address = prop.get("address", "")
    amenities = _amenity_list(prop)

    text = f"""{title}.
Type: {category} à {ptype.lower() if ptype else ''}.
Ville: {city}. Adresse: {address}.
Prix: {price} DH. Surface: {surface} m². Pièces: {rooms}, Chambres: {bedrooms}, Salles de bain: {bathrooms}.
Équipements: {', '.join(amenities) if amenities else 'non spécifié'}.
Description: {description}"""

    return {
        "id": f"property_{pid}",
        "text": text,
        "metadata": {
            "source": "property",
            "property_id": pid,
            "title": title,
            "city": city,
            "category": category,
            "type": ptype,
            "price": float(price or 0),
            "surface": float(surface or 0),
            "rooms": int(rooms or 0),
            "bedrooms": int(bedrooms or 0),
            "bathrooms": int(bathrooms or 0),
            "is_verified": bool(prop.get("is_verified", False)),
        },
    }


def build_city_guides(properties: list) -> list:
    """Aggregate per-city market summaries."""
    city_data = defaultdict(lambda: {"count": 0, "categories": set(), "types": set(), "prices": []})
    for prop in properties:
        city = prop.get("city")
        if not city:
            continue
        data = city_data[city]
        data["count"] += 1
        data["categories"].add(prop.get("category", ""))
        data["types"].add(prop.get("type", ""))
        price = prop.get("price")
        if price:
            data["prices"].append(float(price))

    docs = []
    for city, data in city_data.items():
        avg_price = sum(data["prices"]) / len(data["prices"]) if data["prices"] else 0
        min_price = min(data["prices"]) if data["prices"] else 0
        max_price = max(data["prices"]) if data["prices"] else 0
        text = f"""Guide immobilier {city}.
MAROC-LOC dispose de {data['count']} annonces à {city}.
Types de biens: {', '.join(filter(None, data['categories']))}.
Transactions: {', '.join(filter(None, data['types']))}.
Fourchette de prix: {min_price:,.0f} DH - {max_price:,.0f} DH, prix moyen {avg_price:,.0f} DH.
Pour acheter ou louer à {city}, précisez votre budget, type de bien et quartier recherché."""
        docs.append({
            "id": f"city_guide_{city.lower().replace(' ', '_')}",
            "text": text,
            "metadata": {"source": "city_guide", "city": city},
        })
    return docs


def build_faq_documents() -> list:
    """Static FAQ documents in French (multilingual embeddings allow cross-language retrieval)."""
    faqs = [
        {
            "id": "faq_visite",
            "text": "Comment programmer une visite sur MAROC-LOC? Connectez-vous, choisissez une annonce, cliquez sur 'Demander une visite', sélectionnez une date et un créneau. Le propriétaire recevra une notification et confirmera la visite.",
            "metadata": {"source": "faq", "topic": "visite"},
        },
        {
            "id": "faq_contact_owner",
            "text": "Comment contacter un propriétaire? Ouvrez l'annonce, cliquez sur 'Contacter'. Vous pouvez envoyer un message via la messagerie sécurisée ou voir le numéro de téléphone s'il est public.",
            "metadata": {"source": "faq", "topic": "contact"},
        },
        {
            "id": "faq_paiement",
            "text": "MAROC-LOC propose le paiement sécurisé via CMI pour les publicités premium. Le propriétaire paie pour booster son annonce. Les transactions de location/achat se font directement entre les parties.",
            "metadata": {"source": "faq", "topic": "paiement"},
        },
        {
            "id": "faq_documents",
            "text": "Documents requis pour louer au Maroc: pièce d'identité, justificatif de revenus, attestation de travail, caution. Pour acheter: pièce d'identité, promesse de vente, acte de propriété, attestation de non-engagement, prêt bancaire si financement.",
            "metadata": {"source": "faq", "topic": "documents"},
        },
        {
            "id": "faq_publier",
            "text": "Comment publier une annonce? Créez un compte propriétaire, allez dans 'Créer une annonce', ajoutez titre, description, photos, prix, ville, caractéristiques puis soumettez. L'équipe MAROC-LOC validera l'annonce.",
            "metadata": {"source": "faq", "topic": "publication"},
        },
        {
            "id": "faq_premium",
            "text": "Les annonces premium apparaissent en haut des résultats, bénéficient d'un badge et d'une meilleure visibilité. Le paiement CMI active le plan PREMIUM_ADS.",
            "metadata": {"source": "faq", "topic": "premium"},
        },
        {
            "id": "faq_mortgage",
            "text": "Crédit immobilier au Maroc: taux entre 4.5% et 6.5%, durée jusqu'à 25 ans, apport personnel 10-20%, mensualité max 40-50% du revenu net. Banques principales: Attijariwafa Bank, BMCE, CIH, Banque Populaire.",
            "metadata": {"source": "faq", "topic": "credit"},
        },
        {
            "id": "faq_cgu",
            "text": "Conditions d'utilisation MAROC-LOC: les utilisateurs doivent fournir des informations exactes, ne pas publier de contenu frauduleux, respecter les autres membres et les lois marocaines. L'équipe se réserve le droit de supprimer les annonces non conformes.",
            "metadata": {"source": "faq", "topic": "cgu"},
        },
    ]
    return faqs


def build_process_documents() -> list:
    docs = [
        {
            "id": "process_visite",
            "text": "Processus de visite MAROC-LOC: 1) Le locataire demande une visite depuis l'annonce. 2) Le propriétaire reçoit une notification et propose des créneaux. 3) Le locataire choisit un créneau. 4) Rappel automatique est envoyé. 5) Après la visite, les deux parties peuvent laisser un avis.",
            "metadata": {"source": "process", "topic": "visite"},
        },
        {
            "id": "process_payment_cmi",
            "text": "Processus de paiement CMI: 1) Le propriétaire choisit un plan premium. 2) Le backend initie une transaction CMI PENDING. 3) L'utilisateur est redirigé vers la passerelle CMI. 4) CMI retourne un callback signé. 5) Le backend vérifie la signature HMAC, marque la transaction PAID et active l'annonce premium.",
            "metadata": {"source": "process", "topic": "paiement"},
        },
        {
            "id": "process_owner",
            "text": "Espace propriétaire MAROC-LOC: le propriétaire peut créer des annonces, consulter les statistiques de vues, gérer les visites, répondre aux messages, simuler des prix et activer des publicités premium via CMI.",
            "metadata": {"source": "process", "topic": "proprietaire"},
        },
    ]
    return docs


def main():
    print("Loading approved properties from PostgreSQL...")
    properties = postgres_store.load_properties(limit=settings.RAG_SYNC_LIMIT)
    print(f"Loaded {len(properties)} properties.")

    documents = []

    # Property documents
    for prop in properties:
        documents.append(build_property_document(prop))

    # City guides
    documents.extend(build_city_guides(properties))

    # FAQ + processes
    documents.extend(build_faq_documents())
    documents.extend(build_process_documents())

    print(f"Prepared {len(documents)} documents.")

    pipeline = get_rag_pipeline()
    if not pipeline.initialize():
        print("ERROR: Failed to initialize RAG pipeline.", file=sys.stderr)
        sys.exit(1)

    # Optionally clear existing collection for a clean rebuild
    # pipeline.collection.delete(where={})

    chunks_indexed = pipeline.ingest_documents(documents)
    print(f"Indexed {chunks_indexed} chunks into collection '{pipeline.COLLECTION_NAME}'.")
    print(f"Total vectors in collection: {pipeline.count()}")


if __name__ == "__main__":
    main()
