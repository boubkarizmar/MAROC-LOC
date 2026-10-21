import re
import logging
from typing import Dict, List

logger = logging.getLogger(__name__)


class IntentClassifier:
    """
    Multilingual intent classifier for Moroccan real estate queries.
    Uses rule-based matching with optional zero-shot fallback for English.
    """

    INTENTS = {
        'SEARCH': ['cherche', 'بغيت', 'looking for', 'find', 'تلقى', 'search', 'كنقلب', 'ftech', 'chri', 'kri'],
        'REFINE': ['plus', 'more', 'another', 'autre', 'different', 'أخرى', 'autres', 'kharin'],
        'DETAIL': ['tell me about', 'describe', 'details', 'وصف', 'details about', 'wakhf', 'chof', 'chouf'],
        'QUESTION': ['what', 'where', 'how much', 'when', 'why', 'which', 'اشمن', 'فاش', 'شحال', 'chno', 'wach'],
        'COMPARE': ['compare', 'versus', 'vs', 'between', 'compare', 'مقارنة', 'comparer']
    }

    def __init__(self):
        self._classifier = None

    @property
    def classifier(self):
        """Zero-shot classifier disabled for production performance.
        Rule-based matching is sufficient for real estate intents."""
        return None

    def classify(self, query: str, language: str = None) -> Dict[str, float]:
        """Classify intent with confidence scores. Multilingual-safe."""
        query_lower = query.lower()

        # Rule-based scoring for all languages
        scores = {}
        for intent, keywords in self.INTENTS.items():
            score = sum(1 for kw in keywords if kw.lower() in query_lower)
            scores[intent] = score

        max_rule_score = max(scores.values()) if scores else 0
        if max_rule_score > 0:
            # Normalize rule scores
            total = sum(scores.values())
            primary = max(scores, key=scores.get)
            confidence = scores[primary] / total if total > 0 else 0.5
            return {
                'primary_intent': primary,
                'confidence': round(min(confidence, 0.95), 3),
                'all_scores': {k: round(v / total, 3) if total > 0 else 0 for k, v in scores.items()}
            }

        # Fallback: zero-shot for English only
        if (language == "english" or not re.search(r'[\u0600-\u06FF]', query)) and self.classifier:
            try:
                candidate_labels = list(self.INTENTS.keys())
                result = self.classifier(query, candidate_labels)
                return {
                    'primary_intent': result['labels'][0],
                    'confidence': round(result['scores'][0], 3),
                    'all_scores': dict(zip(result['labels'], [round(s, 3) for s in result['scores']]))
                }
            except Exception as e:
                logger.warning("Zero-shot classification failed: %s", e)

        # Ultimate fallback
        return {
            'primary_intent': 'SEARCH',
            'confidence': 0.5,
            'all_scores': {k: 0.2 for k in self.INTENTS.keys()}
        }


intent_classifier = IntentClassifier()


def get_intent_classifier() -> IntentClassifier:
    """Get the singleton intent classifier instance."""
    return intent_classifier