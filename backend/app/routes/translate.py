import logging
from fastapi import APIRouter, Depends, UploadFile, File, Form
from app.schemas.schemas import TranslationQuery, TranslationResponse
from app.services.gemini import gemini_service

router = APIRouter(prefix="/translate", tags=["Multilingual Translation"])
logger = logging.getLogger(__name__)

@router.post("", response_model=TranslationResponse)
async def translate_text(query: TranslationQuery):
    result = await gemini_service.translate_text(
        text=query.text,
        source_lang=query.source_lang,
        target_lang=query.target_lang
    )
    return result

@router.post("/speech-to-text")
async def speech_to_text(
    audio: UploadFile = File(...),
    source_lang: str = Form("en")
):
    """Simulates converting speech to text for hackathon operations."""
    # Read filename or content
    filename = audio.filename
    logger.info(f"Received speech audio file {filename} in language {source_lang}")
    
    # Mock transcriptions for demo
    mock_transcripts = {
        "es": "Ayuda, ¿dónde está el baño accesible más cercano?",
        "fr": "Où se trouve la sortie d'urgence s'il vous plaît?",
        "ar": "أين يمكنني العثور على محطة الإسعافات الأولية؟",
        "hi": "नमस्ते, क्या आप मुझे गेट 5 का रास्ता दिखा सकते हैं?",
        "en": "Hello, can you help me find Gate 5 please?"
    }
    transcript = mock_transcripts.get(source_lang, "This is a simulated speech transcript for the hackathon demo.")
    return {"transcript": transcript, "source_lang": source_lang}

@router.post("/text-to-speech")
async def text_to_speech(text: str, lang: str = "en"):
    """Simulates synthetic voice playback, returns audio path or audio data."""
    # Return a simulated audio stream path/link for the audio player component in the frontend
    logger.info(f"Synthesizing voice playback for text '{text}' in language {lang}")
    return {
        "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", # Fallback static sample audio
        "text": text,
        "lang": lang
    }
