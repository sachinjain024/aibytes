"""Shared AI-topic keyword patterns for the weekly fetch skills.

fetch_hn_items.py and fetch_gh_items.py both filter their source down to
AI-related items by keyword matching (neither HackerNews nor the GitHub
trending page has usable topic tags). The source-agnostic vocabulary lives
here; each script keeps its own casing rules and source-specific extras and
compiles the combined list with compile_patterns(). Extend ACRONYMS/PHRASES
here as new model/product names emerge — every script that imports this
picks the addition up.
"""

import re

# Acronyms that hide inside ordinary words when lowercased ("air",
# "against", "algorithm"). Prose sources (HN titles) must compile these
# case-sensitively; sources whose text is systematically lowercased
# (GitHub repo names) compile them with re.IGNORECASE instead.
ACRONYMS = (
    r"\bA\.?I\.?\b",  # AI, A.I.
    r"\bAGI\b",
    r"\bLLMs?\b",
    r"\bGPTs?\b",
    r"\bRAG\b",
    r"\bGLM\b",
    r"\bxAI\b",
)

# Names and phrases unambiguous in any casing; compile with re.IGNORECASE.
PHRASES = (
    r"artificial intelligence",
    r"machine[ -]learning",
    r"deep[ -]learning",
    r"neural net",
    r"\blanguage model",
    r"foundation model",
    r"generative ai|genai",
    r"superintelligen",
    r"chatbot",
    r"\bchatgpt\b",
    r"\bopenai\b",
    r"\banthropic\b",
    r"\bclaude\b",
    r"\bgemini\b",
    r"\bdeepmind\b",
    r"\bdeepseek\b",
    r"\bmistral\b",
    r"\bllama\b",
    r"\bqwen\b",
    r"\bgrok\b",
    r"\bcopilot\b",
    r"\bmidjourney\b",
    r"stable diffusion|diffusion model",
    r"hugging ?face",
    r"\bollama\b",
    r"\btransformers?\b",
    r"prompt (injection|engineering)",
    r"fine-?tun",  # fine-tune, fine-tuning
    r"vibe[ -]cod",  # vibe coding, vibe-coded
)

# Domains whose items are AI content regardless of title wording.
DOMAINS = re.compile(
    r"(^|\.)(openai\.com|anthropic\.com|deepmind\.(com|google)|huggingface\.co"
    r"|ollama\.com|mistral\.ai|x\.ai|deepseek\.com|midjourney\.com)$"
)


def compile_patterns(*groups, flags=0):
    """Compile groups of pattern strings into one flat regex list."""
    return [re.compile(p, flags) for group in groups for p in group]
