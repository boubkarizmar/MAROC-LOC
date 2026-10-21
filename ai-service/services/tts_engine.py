"""
Text-to-Speech Engine for MAROC-LOC AI Chatbot

Uses edge-tts (Microsoft Edge TTS) for high-quality, free TTS
in multiple languages: French, Arabic, English.
Darija falls back to Arabic (ar-SA) since Edge TTS doesn't have a Darija voice.

Generates MP3 audio files from text responses for voice assistant feature.
"""

import logging
import asyncio
import tempfile
import os
from typing import Optional
from pathlib import Path

logger = logging.getLogger(__name__)

# Try to import edge-tts, provide graceful fallback
try:
    import edge_tts
    EDGE_TTS_AVAILABLE = True
except ImportError:
    EDGE_TTS_AVAILABLE = False
    logger.warning("edge-tts not installed. TTS features will be disabled.")


# Language to voice mapping
VOICE_MAP = {
    'french': 'fr-FR-DeniseNeural',
    'fr': 'fr-FR-DeniseNeural',
    'arabic': 'ar-SA-ZariyahNeural',
    'ar': 'ar-SA-ZariyahNeural',
    'english': 'en-US-JennyNeural',
    'en': 'en-US-JennyNeural',
    'darija': 'ar-SA-ZariyahNeural',  # Fallback to Arabic for Darija
    'dar': 'ar-SA-ZariyahNeural',
}

# Default output directory for TTS audio files
TTS_OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "tts_outputs")
os.makedirs(TTS_OUTPUT_DIR, exist_ok=True)


class TTSEngine:
    """Text-to-Speech engine using Microsoft Edge TTS."""

    def __init__(self):
        self.available = EDGE_TTS_AVAILABLE
        self.output_dir = Path(TTS_OUTPUT_DIR)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def _get_voice(self, language: str) -> str:
        """Get the appropriate voice for the language."""
        return VOICE_MAP.get(language.lower(), 'en-US-JennyNeural')

    async def generate_audio(
        self,
        text: str,
        language: str = 'french',
        filename: Optional[str] = None,
    ) -> Optional[str]:
        """
        Generate an MP3 audio file from text.

        Args:
            text: The text to speak
            language: Language code (french, arabic, english, darija)
            filename: Optional custom filename (without extension)

        Returns:
            Path to the generated MP3 file, or None if TTS is unavailable
        """
        if not self.available:
            logger.warning("TTS not available: edge-tts is not installed")
            return None

        if not text or not text.strip():
            logger.warning("TTS received empty text")
            return None

        voice = self._get_voice(language)
        output_filename = filename or f"tts_{language}_{hash(text) & 0xFFFFFFFF}.mp3"
        if not output_filename.endswith('.mp3'):
            output_filename += '.mp3'

        output_path = self.output_dir / output_filename

        try:
            communicate = edge_tts.Communicate(text, voice)
            await communicate.save(str(output_path))

            if output_path.exists() and output_path.stat().st_size > 0:
                logger.info(f"TTS generated: {output_path} ({output_path.stat().st_size} bytes)")
                return str(output_path)
            else:
                logger.error("TTS generated empty file")
                return None

        except Exception as e:
            logger.error(f"TTS generation failed: {e}")
            return None

    def generate_audio_sync(
        self,
        text: str,
        language: str = 'french',
        filename: Optional[str] = None,
    ) -> Optional[str]:
        """Synchronous wrapper for generate_audio."""
        try:
            return asyncio.run(self.generate_audio(text, language, filename))
        except Exception as e:
            logger.error(f"TTS sync generation failed: {e}")
            return None

    def cleanup_old_files(self, max_age_hours: int = 24):
        """Remove TTS files older than max_age_hours."""
        try:
            now = asyncio.get_event_loop().time()
            for f in self.output_dir.glob("*.mp3"):
                stat = f.stat()
                age_hours = (now - stat.st_mtime) / 3600
                if age_hours > max_age_hours:
                    f.unlink()
                    logger.debug(f"Cleaned up old TTS file: {f}")
        except Exception as e:
            logger.warning(f"TTS cleanup failed: {e}")


# Global singleton
_tts_engine: Optional[TTSEngine] = None


def get_tts_engine() -> TTSEngine:
    global _tts_engine
    if _tts_engine is None:
        _tts_engine = TTSEngine()
    return _tts_engine
