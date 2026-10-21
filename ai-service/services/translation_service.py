from transformers import pipeline, AutoTokenizer, AutoModelForSeq2SeqLM
import logging
from typing import Dict, Optional

logger = logging.getLogger(__name__)


class TranslationService:
    """HuggingFace-based translation service for Arabic, Darija, French → English"""

    def __init__(self):
        self.models: Dict[str, any] = {}
        self.load_models()

    def load_models(self):
        """Load translation models from HuggingFace"""
        # Arabic to English
        logger.info("Loading Arabic→English model...")
        self.models['ar-en'] = pipeline(
            "translation",
            model="Helsinki-NLP/opus-mt-ar-en"
        )

        # French to English
        logger.info("Loading French→English model...")
        self.models['fr-en'] = pipeline(
            "translation",
            model="Helsinki-NLP/opus-mt-fr-en"
        )

        # Multilingual embedding model
        logger.info("Loading embedding model...")
        from sentence_transformers import SentenceTransformer
        self.embedding_model = SentenceTransformer(
            'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2'
        )

        # Darija needs special handling: it will go through Arabic detection first

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

        if source_lang == 'french':
            result = self.models['fr-en'](text, max_length=512)
            return result[0]['translation_text']

        if source_lang in ['arabic', 'darija']:
            # Darija uses Arabic translation model
            result = self.models['ar-en'](text, max_length=512)
            return result[0]['translation_text']

        return text

    def embed_text(self, text: str) -> list:
        """Generate embeddings for vector search"""
        return self.embedding_model.encode([text], convert_to_numpy=True).tolist()[0]


translation_service = TranslationService()