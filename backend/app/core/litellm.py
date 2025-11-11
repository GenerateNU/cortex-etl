import base64
import os
from enum import Enum

from litellm import acompletion, aembedding
from litellm.types.utils import EmbeddingResponse, ModelResponse


class ModelType(Enum):
    """Available LLM models."""

    GEMINI_PRO = "gemini/gemini-2.5-pro"
    GEMINI_FLASH = "gemini/gemini-2.0-flash-exp"
    GPT_5_PRO = "openai/gpt-5-pro"
    GPT_4O = "openai/gpt-4o"


class EmbeddingModelType(Enum):
    """Available embedding models."""

    # Gemini models (768 default, supports up to 3072)
    GEMINI_TEXT_EMBEDDING = "gemini/text-embedding-004"

    # OpenAI models
    OPENAI_SMALL = "text-embedding-3-small"  # 1536 dimensions
    OPENAI_LARGE = "text-embedding-3-large"  # 3072 dimensions

    # BERT models
    # MODERNBERT_EMBED_BASE = "modernbert-embed-base" # 768 dimensions


class LLMClient:
    """Simplified LLM client for agentic workflows."""

    def __init__(self):
        """Initialize client and load API keys."""
        self.model = ModelType.GEMINI_FLASH
        self.embedding_model = EmbeddingModelType.GEMINI_TEXT_EMBEDDING
        self.system_prompt: str | None = None
        self._load_api_keys()

    def _load_api_keys(self) -> None:
        """Load API keys from environment."""
        for key in ["GEMINI_API_KEY", "OPENAI_API_KEY", "ANTHROPIC_API_KEY"]:
            if key in os.environ:
                os.environ[key] = os.environ[key]

    def set_model(self, model: ModelType) -> None:
        """Set the model to use for completions."""
        self.model = model

    def set_embedding_model(self, model: EmbeddingModelType) -> None:
        """Set the embedding model to use."""
        self.embedding_model = model

    def set_system_prompt(self, system_prompt: str) -> None:
        """Set the system prompt for all requests."""
        self.system_prompt = system_prompt

    async def embed(
        self,
        input_text: str | list[str],
        model: EmbeddingModelType | None = None,
    ) -> list[float] | list[list[float]]:
        """
        Generate embeddings for text.
        ALWAYS returns 1536-dimensional vectors regardless of model.

        Args:
            input_text: Single string or list of strings to embed
            model: Override default embedding model

        Returns:
            Single 1536-dim vector or list of 1536-dim vectors

        """
        embed_model = model.value if model else self.embedding_model.value

        # Ensure input is a list
        inputs = [input_text] if isinstance(input_text, str) else input_text

        # Generate embeddings with fixed dimensions
        response: EmbeddingResponse = await aembedding(
            model=embed_model, input=inputs, dimensions=768
        )

        # Extract embeddings
        embeddings = [data.embedding for data in response.data]

        # Return single embedding if single input
        return embeddings[0] if isinstance(input_text, str) else embeddings

    async def chat(
        self,
        content: str,
        pdf_bytes: bytes | None = None,
        temperature: float = 0.7,
        max_tokens: int | None = None,
        json_response: bool = False,
    ) -> ModelResponse:
        """
        Send a completion request.

        Args:
            content: Text prompt/question
            pdf_bytes: Optional PDF file bytes
            temperature: Sampling temperature (0-2), default 0.7
            max_tokens: Max tokens to generate
            json_response: Force JSON output format

        Returns:
            ModelResponse with completion
        """
        messages = []

        # Add system prompt if set
        if self.system_prompt:
            messages.append({"role": "system", "content": self.system_prompt})

        # Build user message
        if pdf_bytes:
            # Encode PDF as base64
            encoded = base64.b64encode(pdf_bytes).decode("utf-8")
            base64_pdf = f"data:application/pdf;base64,{encoded}"

            messages.append(
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": content},
                        {"type": "image_url", "image_url": {"url": base64_pdf}},
                    ],
                }
            )
        else:
            messages.append({"role": "user", "content": content})

        return await acompletion(
            model=self.model.value,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            response_format={"type": "json_object"} if json_response else None,
        )
