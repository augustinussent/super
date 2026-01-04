import os
from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage

load_dotenv()

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

async def generate_alt_text(image_url: str) -> str:
    """Generate SEO-friendly alt text for an image using AI"""
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"alt-text-{image_url[:20]}",
            system_message="You are an SEO expert for a luxury hotel in Batu, East Java, Indonesia called Spencer Green Hotel. Generate concise, SEO-friendly alt text for hotel images. Focus on: location (Batu, East Java), luxury keywords, hotel amenities. Keep it under 125 characters. Return ONLY the alt text, no quotes or explanation."
        ).with_model("openai", "gpt-4o-mini")
        
        user_message = UserMessage(text=f"Generate SEO alt text for this hotel image: {image_url}")
        response = await chat.send_message(user_message)
        return response.strip()
    except Exception:
        return "Spencer Green Hotel Batu - Luxury accommodation in East Java"

async def generate_copy(prompt: str, content_type: str = "general") -> str:
    """Generate marketing copy using AI"""
    try:
        system_messages = {
            "general": "You are a professional copywriter for Spencer Green Hotel, a luxury hotel in Batu, East Java, Indonesia. Write engaging, professional marketing copy.",
            "room_description": "You are a luxury hotel copywriter. Write elegant, enticing room descriptions that highlight comfort, amenities, and the unique experience at Spencer Green Hotel Batu.",
            "promo": "You are a marketing expert. Write compelling promotional content that creates urgency and highlights value for Spencer Green Hotel Batu.",
            "seo": "You are an SEO specialist. Write search-engine optimized content for Spencer Green Hotel Batu that includes relevant keywords naturally."
        }
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"copywriter-{content_type}",
            system_message=system_messages.get(content_type, system_messages["general"])
        ).with_model("openai", "gpt-4o-mini")
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        return response.strip()
    except Exception as e:
        return f"Error generating copy: {str(e)}"

async def translate_content(text: str, target_language: str) -> str:
    """Translate content to target language"""
    try:
        lang_map = {
            "zh": "Chinese (Mandarin, Simplified)",
            "en": "English",
            "id": "Indonesian"
        }
        
        target = lang_map.get(target_language, "English")
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"translate-{target_language}",
            system_message=f"You are a professional translator. Translate the following text to {target}. Maintain the tone and style suitable for a luxury hotel. Return ONLY the translated text, no explanations."
        ).with_model("openai", "gpt-4o-mini")
        
        user_message = UserMessage(text=f"Translate this to {target}: {text}")
        response = await chat.send_message(user_message)
        return response.strip()
    except Exception:
        return text  # Return original if translation fails

async def generate_meta_content(page_name: str, page_content: str) -> dict:
    """Generate meta title and description for SEO"""
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"meta-{page_name}",
            system_message="You are an SEO expert. Generate meta title (max 60 chars) and meta description (max 155 chars) for hotel web pages. Include location keywords: Batu, East Java, Indonesia. Return in format: TITLE: [title]\nDESCRIPTION: [description]"
        ).with_model("openai", "gpt-4o-mini")
        
        user_message = UserMessage(text=f"Generate meta content for the '{page_name}' page of Spencer Green Hotel. Page content summary: {page_content[:500]}")
        response = await chat.send_message(user_message)
        
        lines = response.strip().split('\n')
        title = ""
        description = ""
        
        for line in lines:
            if line.startswith("TITLE:"):
                title = line.replace("TITLE:", "").strip()
            elif line.startswith("DESCRIPTION:"):
                description = line.replace("DESCRIPTION:", "").strip()
        
        return {
            "title": title or f"Spencer Green Hotel Batu - {page_name}",
            "description": description or f"Experience luxury at Spencer Green Hotel in Batu, East Java. {page_name} - Book now for the best rates."
        }
    except Exception:
        return {
            "title": f"Spencer Green Hotel Batu - {page_name}",
            "description": "Experience luxury at Spencer Green Hotel in Batu, East Java."
        }
