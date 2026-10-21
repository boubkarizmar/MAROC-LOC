from transformers import pipeline, AutoTokenizer, AutoModelForSeq2SeqLM
import logging
from typing import Dict, Optional

logger = logging.getLogger(__name__)


class TranslationService:
    """HuggingFace-based translation service for Arabic, Darija, French → English

    Uses lazy loading to avoid massive startup delays and memory usage.
    """

    def __init__(self):
        self._models: Dict[str, any] = {}
        self._embedding_model = None
        self._models_loaded = False

    def _load_models(self):
        """Lazy-load translation models from HuggingFace."""
        if self._models_loaded:
            return
        logger.info("Loading translation models...")
        # Arabic to English
        self._models['ar-en'] = pipeline(
            "translation",
            model="Helsinki-NLP/opus-mt-ar-en",
            device=-1,
        )
        # French to English
        self._models['fr-en'] = pipeline(
            "translation",
            model="Helsinki-NLP/opus-mt-fr-en",
            device=-1,
        )
        self._models_loaded = True
        logger.info("Translation models loaded")

    def _load_embedding_model(self):
        """Lazy-load embedding model."""
        if self._embedding_model is None:
            logger.info("Loading embedding model...")
            from sentence_transformers import SentenceTransformer
            self._embedding_model = SentenceTransformer(
                'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2'
            )
            logger.info("Embedding model loaded")

    def detect_language(self, text: str) -> str:
        """Detect language: darija, arabic, french, english"""
        import re

        # Arabic script detection
        if re.search(r'[\u0600-\u06FF]', text):
            # Check for Darija-specific words
            darija_words = ['دار', 'شقة', 'فيلا', 'بغيت', 'كاين', 'فاش', 'اشمن']
            if any(word in text for word in darija_words):
                return 'darija'
            return 'arabic'

        # French detection
        french_words = ['je', 'tu', 'nous', 'vous', 'cherche', 'appartement', 'maison']
        if any(word in text.lower() for word in french_words):
            return 'french'

        return 'english'

    def translate_to_english(self, text: str, source_lang: str) -> str:
        """Translate any supported language to English"""
        if source_lang == 'english':
            return text

        self._load_models()

        if source_lang == 'french' and 'fr-en' in self._models:
            result = self._models['fr-en'](text, max_length=512)
            return result[0]['translation_text']

        if source_lang in ['arabic', 'darija'] and 'ar-en' in self._models:
            result = self._models['ar-en'](text, max_length=512)
            return result[0]['translation_text']

        return text

    def embed_text(self, text: str) -> list:
        """Generate embeddings for vector search"""
        self._load_embedding_model()
        return self._embedding_model.encode([text], convert_to_numpy=True).tolist()[0]


translation_service = TranslationService()