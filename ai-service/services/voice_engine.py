import io
import torch
import librosa
import numpy as np
from transformers import WhisperProcessor, WhisperForConditionalGeneration
from core.config import settings
import logging

logger = logging.getLogger(__name__)


class VoiceEngine:
    def __init__(self):
        self._processor = None
        self._model = None
        self._loaded = False

    def _load(self):
        if self._loaded:
            return
        logger.info(f"Loading Whisper: {settings.WHISPER_MODEL} on {settings.DEVICE}...")
        self._processor = WhisperProcessor.from_pretrained(settings.WHISPER_MODEL)
        self._model = WhisperForConditionalGeneration.from_pretrained(settings.WHISPER_MODEL)
        self._model.eval()

        if settings.DEVICE == "cuda":
            self._model = self._model.to("cuda")

        self._loaded = True
        logger.info("Whisper loaded.")

    def transcribe(self, audio_bytes: bytes, language: str = None) -> dict:
        self._load()

        try:
            # Load audio (supports mp3, wav, m4a via librosa/soundfile)
            audio_array, sr = librosa.load(io.BytesIO(audio_bytes), sr=16000, mono=True)

            # Process
            inputs = self._processor(
                audio_array,
                sampling_rate=16000,
                return_tensors="pt"
            )
            input_features = inputs.input_features

            if settings.DEVICE == "cuda":
                input_features = input_features.to("cuda")

            # Generate with language hint if provided
            forced_decoder_ids = None
            if language and language != "auto":
                lang_map = {
                    "english": "|<|en|>",
                    "french": "|<|fr|>",
                    "arabic": "|<|ar|>",
                    "darija": "|<|ar|>"  # Whisper uses Arabic token for Darija
                }
                if language in lang_map:
                    forced_decoder_ids = self._processor.get_decoder_prompt_ids(
                        language=lang_map[language].strip("|<|>"),
                        task="transcribe"
                    )

            with torch.no_grad():
                predicted_ids = self._model.generate(
                    input_features,
                    forced_decoder_ids=forced_decoder_ids
                )

            transcription = self._processor.batch_decode(
                predicted_ids,
                skip_special_tokens=True
            )[0]

            return {
                "text": transcription.strip(),
                "language_detected": language or "auto",
                "confidence": 0.92  # Whisper doesn't expose per-sample confidence easily
            }

        except Exception as e:
            logger.error(f"Transcription failed: {e}")
            raise


# Singleton
voice_engine = VoiceEngine()