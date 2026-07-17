"""Multilingual translation and speech-processing endpoints.

Provides text translation via Gemini AI (with Google Translate and
offline dictionary fallbacks), simulated speech-to-text transcription,
and simulated text-to-speech synthesis for international fan assistance.
"""

import logging

from fastapi import APIRouter, UploadFile, File, Form

from app.schemas.schemas import TranslationQuery, TranslationResponse
from app.services.gemini import gemini_service

router = APIRouter(prefix="/translate", tags=["Multilingual Translation"])
logger = logging.getLogger(__name__)


@router.post("", response_model=TranslationResponse)
async def translate_text(query: TranslationQuery) -> dict:
    """Translate text between languages using AI with cascading fallbacks."""
    result = await gemini_service.translate_text(
        text=query.text,
        source_lang=query.source_lang,
        target_lang=query.target_lang,
    )
    return result


@router.post("/speech-to-text")
async def speech_to_text(
    audio: UploadFile = File(...),
    source_lang: str = Form("en"),
) -> dict:
    """Convert uploaded speech audio to text (simulated for hackathon demo)."""
    filename = audio.filename
    logger.info("Received speech audio file %s in language %s", filename, source_lang)

    # Mock transcriptions for demo
    mock_transcripts = {
        "es": "Ayuda, ¿dónde está el baño accesible más cercano?",
        "fr": "Où se trouve la sortie d'urgence s'il vous plaît?",
        "ar": "أين يمكنني العثور على محطة الإسعافات الأولية؟",
        "hi": "नमस्ते, क्या आप मुझे गेट 5 का रास्ता दिखा सकते हैं?",
        "en": "Hello, can you help me find Gate 5 please?",
    }
    transcript = mock_transcripts.get(
        source_lang, "This is a simulated speech transcript for the hackathon demo."
    )
    return {"transcript": transcript, "source_lang": source_lang}


@router.post("/text-to-speech")
async def text_to_speech(text: str, lang: str = "en") -> dict:
    """Synthesise voice playback for the given text (simulated for hackathon demo)."""
    logger.info("Synthesizing voice playback for text '%s' in language %s", text, lang)
    return {
        "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        "text": text,
        "lang": lang,
    }
