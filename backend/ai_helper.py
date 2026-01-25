import os
import base64
from typing import Optional
from dotenv import load_dotenv
from openai import AsyncOpenAI

load_dotenv()

# Use Emergent LLM API key from environment
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

client = AsyncOpenAI(
    api_key=EMERGENT_LLM_KEY,
    base_url="https://api.emergentagent.com/v1"
) if EMERGENT_LLM_KEY else None


async def generate_image_caption(image_content: bytes, context: str = "hotel") -> dict:
    """
    Generate caption and alt text for an image using GPT-4 Vision.
    Returns dict with 'caption' and 'alt_text' keys.
    """
    if not client:
        return {
            "caption": "",
            "alt_text": "Spencer Green Hotel Batu",
            "success": False,
            "error": "OpenAI API key not configured"
        }
    
    try:
        # Convert image bytes to base64
        base64_image = base64.b64encode(image_content).decode('utf-8')
        
        # Determine image type (assume jpeg if unknown)
        image_type = "image/jpeg"
        
        context_prompts = {
            "hotel": "This is an image for Spencer Green Hotel Batu, a luxury hotel in East Java, Indonesia.",
            "room": "This is a hotel room image for Spencer Green Hotel Batu.",
            "gallery": "This is a gallery image for Spencer Green Hotel Batu website.",
            "facilities": "This is an image of hotel facilities at Spencer Green Hotel Batu.",
            "restaurant": "This is a restaurant/dining image for Spencer Green Hotel Batu.",
        }
        
        context_text = context_prompts.get(context, context_prompts["hotel"])
        
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": f"""You are an AI assistant for Spencer Green Hotel Batu. {context_text}
                    
Analyze this image and provide:
1. A short, descriptive caption (max 50 chars, in Indonesian)
2. SEO-optimized alt text (max 125 chars, in English)

Respond in this exact JSON format:
{{"caption": "your caption here", "alt_text": "your alt text here"}}"""
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{image_type};base64,{base64_image}",
                                "detail": "low"
                            }
                        },
                        {
                            "type": "text",
                            "text": "Generate caption and alt text for this image."
                        }
                    ]
                }
            ],
            max_tokens=200
        )
        
        result_text = response.choices[0].message.content.strip()
        
        # Parse JSON response
        import json
        try:
            # Try to extract JSON from response
            if "{" in result_text and "}" in result_text:
                json_start = result_text.index("{")
                json_end = result_text.rindex("}") + 1
                json_str = result_text[json_start:json_end]
                result = json.loads(json_str)
                return {
                    "caption": result.get("caption", ""),
                    "alt_text": result.get("alt_text", "Spencer Green Hotel Batu"),
                    "success": True
                }
        except (json.JSONDecodeError, ValueError):
            pass
        
        # Fallback: use the raw text as caption
        return {
            "caption": result_text[:50] if len(result_text) > 50 else result_text,
            "alt_text": "Spencer Green Hotel Batu - Luxury accommodation in East Java",
            "success": True
        }
        
    except Exception as e:
        return {
            "caption": "",
            "alt_text": "Spencer Green Hotel Batu",
            "success": False,
            "error": str(e)
        }


async def generate_alt_text(image_url: str) -> str:
    """Generate SEO alt text for an image URL."""
    if not client:
        return "Spencer Green Hotel Batu - Luxury accommodation in East Java"
    
    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an SEO expert for Spencer Green Hotel Batu. Generate concise alt text (max 125 chars)."},
                {"role": "user", "content": f"Generate SEO alt text for this image: {image_url}"}
            ]
        )
        return response.choices[0].message.content.strip()
    except Exception:
        return "Spencer Green Hotel Batu - Luxury accommodation in East Java"


async def generate_copy(prompt: str, content_type: str = "general") -> str:
    """Generate marketing copy for the hotel."""
    if not client:
        return f"Error: OpenAI API key not configured"
    
    try:
        system_messages = {
            "general": "You are a professional copywriter for Spencer Green Hotel, Batu.",
            "room_description": "Write elegant room descriptions for Spencer Green Hotel Batu.",
            "promo": "Write compelling promotional content for Spencer Green Hotel Batu.",
            "seo": "Write SEO-optimized content for Spencer Green Hotel Batu."
        }
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_messages.get(content_type, system_messages["general"])},
                {"role": "user", "content": prompt}
            ]
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"Error generating copy: {str(e)}"


async def translate_content(text: str, target_language: str) -> str:
    """Translate content to target language."""
    if not client:
        return text
    
    try:
        lang_map = {"zh": "Chinese (Mandarin, Simplified)", "en": "English", "id": "Indonesian"}
        target = lang_map.get(target_language, "English")
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": f"Translate to {target}. Return ONLY text."},
                {"role": "user", "content": f"Translate: {text}"}
            ]
        )
        return response.choices[0].message.content.strip()
    except Exception:
        return text
