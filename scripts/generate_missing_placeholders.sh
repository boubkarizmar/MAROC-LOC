#!/bin/bash
# Copie des images placeholder existantes pour les propriétés seedées dans le conteneur backend.
set -e

CONTAINER="marocloc-backend"
UPLOAD_DIR="/app/uploads"

PGPASS="${POSTGRES_PASSWORD:-marocloc_secret_2024}"

# Récupère tous les chemins uniques
paths=$(docker exec -e PGPASSWORD="$PGPASS" marocloc-postgres psql -U marocloc -d marocloc_db -t -A -c "SELECT DISTINCT jsonb_array_elements_text(images) FROM property WHERE images IS NOT NULL AND jsonb_array_length(images) > 0;")

# Prépare un répertoire temporaire
TMP_DIR=$(mktemp -d)
trap "rm -rf $TMP_DIR" EXIT

count=0
for p in $paths; do
  # Nettoie le chemin
  rel="${p#/}"
  [[ "$rel" == uploads/* ]] || rel="uploads/$rel"

  ext="${rel##*.}"
  target="$TMP_DIR/$rel"
  mkdir -p "$(dirname "$target")"

  if [[ "$ext" == "png" ]]; then
    cp "frontend/public/images/logo.png" "$target"
  else
    cp "frontend/public/images/hero-bg.jpeg" "$target"
  fi

  count=$((count + 1))
done

echo "Préparé $count placeholders dans $TMP_DIR"

# Copie dans le conteneur backend
docker exec "$CONTAINER" sh -c "mkdir -p $UPLOAD_DIR/images"
docker cp "$TMP_DIR/uploads/." "$CONTAINER:$UPLOAD_DIR/"

echo "Copie terminée dans $CONTAINER:$UPLOAD_DIR"
