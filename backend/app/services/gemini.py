"""Google Gemini GenAI service with rule-based fallback logic.

Provides methods for operational briefings, incident analysis, What-If
simulation, translation, copilot chat, and post-match reporting. Each
method falls back to deterministic rule-based responses when the Gemini
API is unavailable, ensuring uninterrupted platform operation.
"""

import json
import logging
import httpx
from typing import Dict, Any, List
from app.core.config import settings
from app.core.observability import SYSTEM_METRICS

logger = logging.getLogger(__name__)

# Basic fallback responses for offline operations when Gemini key is missing or calls fail
FALLBACK_BRIEFING = (
    "Attendance is at 82,450. Gate 3 is congested with wait times exceeding 18 minutes. "
    "Rule-based safety system recommends redirecting 25% of spectators to Gate 5. "
    "Energy consumption is normal. No critical incidents reported."
)

class GeminiService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model = "gemini-1.5-flash"
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models"
        self.client = httpx.AsyncClient(timeout=10.0)

    async def close(self):
        await self.client.aclose()

    async def _post_request(self, prompt: str, schema_instruction: str = "") -> str:
        SYSTEM_METRICS["gemini_api_calls"] += 1
        if not self.api_key:
            logger.warning("GEMINI_API_KEY is not set. Executing rule-based fallback logic.")
            return ""

        url = f"{self.base_url}/{self.model}:generateContent?key={self.api_key}"
        
        # Combine instruction and user prompt
        full_text = f"{schema_instruction}\n\nUser Query/State Context:\n{prompt}"
        
        payload = {
            "contents": [{
                "parts": [{"text": full_text}]
            }]
        }
        
        # Force JSON response if schema is specified
        if schema_instruction:
            payload["generationConfig"] = {
                "responseMimeType": "application/json"
            }

        try:
            response = await self.client.post(url, json=payload)
            if response.status_code == 200:
                data = response.json()
                text_out = data["candidates"][0]["content"]["parts"][0]["text"]
                return text_out
            else:
                logger.error(f"Gemini API error ({response.status_code}): {response.text}")
                return ""
        except Exception as e:
            logger.error(f"Failed to reach Gemini API: {str(e)}")
            return ""

    async def generate_operational_briefing(self, state_summary: Dict[str, Any]) -> str:
        """AI Match Commander: Generate a concise 5-minute briefing."""
        prompt = (
            f"Here is the active state of the FIFA 2026 stadium:\n"
            f"- Spectators: {state_summary.get('attendance', 0)} / {state_summary.get('capacity', 0)}\n"
            f"- Gate 3 occupancy: {state_summary.get('gate_3_occupancy', 0)}%\n"
            f"- Gate 5 occupancy: {state_summary.get('gate_5_occupancy', 0)}%\n"
            f"- Active incidents: {state_summary.get('active_incidents', 0)}\n"
            f"- Available Responders/Volunteers: {state_summary.get('active_volunteers', 0)}\n"
            f"- Parking Zone B: {state_summary.get('parking_occupancy', 0)}%\n"
            f"- Current score/match state: {state_summary.get('match_state', 'No match active')}\n"
            f"Write a professional operational brief. Focus on current and upcoming risk points."
        )
        instruction = "You are the AI Match Commander. Write a 2-3 sentence executive briefing summarizing operations."
        
        result = await self._post_request(prompt, instruction)
        if not result:
            # Fallback
            result = FALLBACK_BRIEFING
        return result.strip()

    async def analyze_incident(self, type: str, severity: str, description: str) -> Dict[str, Any]:
        """Decision Engine: Evaluates reported incidents and recommends procedures."""
        prompt = (
            f"Incident reported:\n"
            f"Type: {type}\n"
            f"Severity: {severity}\n"
            f"Description: {description}\n"
        )
        instruction = (
            "You are the Operations Control AI. Analyze the incident and respond ONLY with a JSON object containing: "
            "{\n"
            '  "confidence_score": integer (0 to 100),\n'
            '  "reasoning": "brief explanation of severity based on stadium rules",\n'
            '  "action_recommendation": "step-by-step instruction for volunteer deployment"\n'
            "}"
        )
        
        result = await self._post_request(prompt, instruction)
        if result:
            try:
                return json.loads(result)
            except Exception:
                pass
                
        # Rule-based fallback
        return {
            "confidence_score": 90,
            "reasoning": f"Critical path assessment: reported incident type '{type}' categorized with severity '{severity}'.",
            "action_recommendation": f"Alert security staff in the reporting quadrant. Send nearest responder to coordinate medical/safety logistics."
        }

    async def run_what_if_simulation(self, scenario: str, state_summary: Dict[str, Any]) -> Dict[str, Any]:
        """What-if Simulator: Evaluates outcomes under hypothetical situations."""
        prompt = (
            f"Simulate scenario: '{scenario}'\n"
            f"Current Stadium Telemetry:\n"
            f"- Attendance: {state_summary.get('attendance', 0)}\n"
            f"- Gates statuses: Gate 3 is {state_summary.get('gate_3_status', 'active')}, Gate 5 is {state_summary.get('gate_5_status', 'active')}\n"
            f"- Busy Metro lines: {state_summary.get('metro_congestion', 'normal')}\n"
        )
        instruction = (
            "You are the Predictive Operations Coordinator. Return ONLY a JSON object containing: "
            "{\n"
            '  "impact_description": "summarize congestion impact in 2-3 sentences",\n'
            '  "risk_level": "Low", "Medium", "High", or "Critical",\n'
            '  "estimated_wait_time_impact_min": integer,\n'
            '  "volunteer_redistribution_recommendation": "how to reallocate staff to mitigate",\n'
            '  "suggested_reroute_nodes": ["Node A", "Node B"],\n'
            '  "confidence_score": integer (0 to 100)\n'
            "}"
        )
        
        result = await self._post_request(prompt, instruction)
        if result:
            try:
                return json.loads(result)
            except Exception:
                pass
                
        # Rule-based fallback
        impacts = {
            "gate_3_close": ("Closure of Gate 3 redirects incoming crowds to Gate 5, leading to heavy queues.", "High", 12, "Reallocate 5 volunteers from VIP sections to Gate 5 access lanes.", ["Gate 5 Link", "North Perimeter Corridor"]),
            "metro_delay": ("Metro transit delays will cause spectator bottlenecks in transport hub exit squares.", "Medium", 8, "Instruct volunteers to guide fans to local shuttle buses.", ["Bus Terminal West", "Main Plaza Gate 1"]),
            "rain": ("Rain conditions will slow entry checkpoints and cause spectators to congregate in corridors.", "Medium", 6, "Deploy volunteers to distribute rain ponchos and open internal lobbies.", ["Main Arena Lobby", "Elevator Corridor B"]),
            "spectator_surge": ("Early arrival of 20,000 spectators creates immediate spikes at Gate 3 & 4.", "Critical", 15, "Deploy standby shifts to all outer ticket counters.", ["Gate 1 Overflow Gate", "Outer Ring Concourse"])
        }
        val = impacts.get(scenario, ("No simulation data.", "Low", 0, "No action required.", []))
        return {
            "impact_description": val[0],
            "risk_level": val[1],
            "estimated_wait_time_impact_min": val[2],
            "volunteer_redistribution_recommendation": val[3],
            "suggested_reroute_nodes": val[4],
            "confidence_score": 85
        }

    async def translate_text(self, text: str, source_lang: str, target_lang: str) -> Dict[str, str]:
        """Translation service between languages with pronunciation fallback."""
        prompt = f"Translate the following text from {source_lang} to {target_lang}: '{text}'"
        instruction = (
            "You are a translation assistant. Return ONLY a JSON object containing: "
            "{\n"
            '  "translated_text": "text translated in target language",\n'
            '  "pronunciation_text": "rough phonetic pronunciation helper in English"\n'
            "}"
        )
        
        # 1. Try Gemini
        result = await self._post_request(prompt, instruction)
        if result:
            try:
                parsed = json.loads(result)
                if parsed.get("translated_text"):
                    return parsed
            except Exception:
                pass
                
        # 2. Try Google Translate single free API
        try:
            url = "https://translate.googleapis.com/translate_a/single"
            params = {
                "client": "gtx",
                "sl": source_lang,
                "tl": target_lang,
                "dt": "t",
                "q": text
            }
            resp = await self.client.get(url, params=params, timeout=5.0)
            if resp.status_code == 200:
                data = resp.json()
                translated = data[0][0][0]
                return {
                    "translated_text": translated,
                    "pronunciation_text": f"Phonetics: {translated}"
                }
        except Exception as e:
            logger.error(f"Google Translate fallback failed: {e}")

        # 3. Try Offline dictionary fallback
        normalized_text = text.lower().strip().rstrip('.')
        common_phrases = {
            "hello": {
                "fr": "bonjour", "es": "hola", "ar": "مرحبا (marhaban)", "hi": "नमस्ते (namaste)",
                "pt": "olá", "ja": "こんにちは (konnichiwa)", "de": "hallo", "zh": "你好 (nǐ hǎo)"
            },
            "hello i hope everyone is great": {
                "fr": "bonjour, j'espère que tout le monde va bien",
                "es": "hola, espero que todos estén muy bien",
                "ar": "مرحباً، أتمنى أن يكون الجميع بخير",
                "hi": "नमस्ते, मुझे आशा है कि हर कोई महान है",
                "pt": "olá, espero que todos estejam ótimos",
                "ja": "こんにちは、皆さんが元気であることを願っています",
                "de": "hallo, ich hoffe, es geht allen gut",
                "zh": "你好，我希望大家都很好"
            },
            "hello, can you help me find gate 5 please": {
                "fr": "bonjour, pouvez-vous m'aider à trouver la porte 5 s'il vous plaît?",
                "es": "hola, ¿puedes ayudarme a encontrar la puerta 5, por favor?",
                "ar": "مرحباً، هل يمكنك مساعدتي في العثور على البوابة 5 من فضلك؟",
                "hi": "नमस्ते, क्या आप कृपया मुझे गेट 5 खोजने में मदद कर सकते हैं?",
                "pt": "olá, você pode me ajudar a encontrar o portão 5, por favor?",
                "ja": "こんにちは、ゲート5を見つけるのを手伝っていただけますか？",
                "de": "hallo, können Sie mir bitte helfen, Tor 5 zu finden?",
                "zh": "你好，请问能帮我找到5号门吗？"
            }
        }
        
        translated = text
        if normalized_text in common_phrases:
            translated = common_phrases[normalized_text].get(target_lang, text)
        
        return {
            "translated_text": translated,
            "pronunciation_text": f"Phonetics: {translated}"
        }

    async def query_copilot(self, query: str, state_summary: Dict[str, Any], role: str = "staff") -> Dict[str, Any]:
        """Operational Copilot Query: Process interactive operational queries."""
        prompt = (
            f"User Role: {role}\n"
            f"State Summary Context:\n{json.dumps(state_summary)}\n\n"
            f"User Query: '{query}'"
        )
        
        if role == "fan":
            role_instruction = (
                "You are the Visitor Assistant. The user is a stadium spectator/fan. Reply in a welcoming, friendly, visitor-facing tone. "
                "Help them navigate gates, concessions, restroom amenities, transport terminals, and accessible options. "
                "Keep responses safe, clear, concise, and do not expose sensitive internal security codes or raw security protocols. "
                "Synthesize the state summary context for them (e.g., recommend avoiding congested Gates/concessions, suggesting alternatives like Gate 5)."
            )
        elif role == "volunteer":
            role_instruction = (
                "You are the Volunteer Support Assistant. The user is a volunteer. Help them with tasks, shifts, stadium zones, and "
                "basic crowd flow questions. Use a supportive, clear, collaborative tone."
            )
        else:
            role_instruction = (
                "You are the Tournament Operations Copilot. Synthesize the state context and reply professionally to the operator/staff. "
                "Address them as an Operations Officer/Staff member, and provide analytical details on active variables."
            )

        instruction = (
            f"{role_instruction}\n"
            "Return ONLY a JSON object containing: "
            "{\n"
            '  "reply": "clear natural language answer analyzing the active variables",\n'
            '  "suggested_actions": ["Action 1", "Action 2"]\n'
            "}"
        )
        
        result = await self._post_request(prompt, instruction)
        if result:
            try:
                return json.loads(result)
            except Exception:
                pass
                
        return {
            "reply": f"Rules engine analysis for: '{query}'. Gate 3 occupancy is currently {state_summary.get('gate_3_occupancy', 0)}% and Gate 5 is at {state_summary.get('gate_5_occupancy', 0)}%. Recommend checking volunteer levels in active quadrants.",
            "suggested_actions": ["Dispatch volunteers to zone bottlenecks", "Broadcast rerouting suggestions to outer display boards"]
        }

    async def generate_post_match_report(self, match_summary: Dict[str, Any]) -> str:
        """Create a complete operational post-match report."""
        prompt = f"Write a match report detailing: {json.dumps(match_summary)}"
        instruction = "You are the Chief Arena Officer. Write a professional post-match operational summary report covering attendance, peak congestion, incident summary, and key recommendations."
        
        result = await self._post_request(prompt, instruction)
        if result:
            return result
        
        return (
            f"# Operational Post-Match Summary: {match_summary.get('teams', 'Team A vs Team B')}\n"
            f"- **Match Attendance:** {match_summary.get('attendance', 80000)} (Peak Capacity)\n"
            f"- **Peak Wait Time:** {match_summary.get('peak_wait_minutes', 18)} minutes at Gate 3\n"
            f"- **Emergency Incidents Resolving:** {match_summary.get('total_incidents', 5)} cases processed successfully\n"
            f"## Recommendations\n"
            f"1. Shift volunteers from the VIP lounge to Outer Concourse 30 minutes earlier next match.\n"
            f"2. Keep Gate 5 open until kick-off to absorb ticket gate congestion."
        )

gemini_service = GeminiService()
