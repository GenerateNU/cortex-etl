import base64
import os
from enum import Enum

from litellm import completion
from litellm.types.utils import ModelResponse


class ModelType(Enum):
    """Available LLM models."""

    GEMINI_PRO = "gemini/gemini-2.5-pro"
    GEMINI_FLASH = "gemini/gemini-2.0-flash-exp"
    GPT_5_PRO = "openai/gpt-5-pro"
    GPT_4O = "openai/gpt-4o"


class LLMClient:
    """Simplified LLM client for agentic workflows."""

    def __init__(self):
        """Initialize client and load API keys."""
        self.model = ModelType.GEMINI_FLASH
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

    def set_system_prompt(self, system_prompt: str) -> None:
        """Set the system prompt for all requests."""
        self.system_prompt = system_prompt

    def chat(
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

        Returns:
            ModelResponse with completion

        Example:
            >>> client = LLMClient()
            >>> response = client.chat("What is 2+2?")
            >>> print(response.choices[0].message.content)

            >>> with open("doc.pdf", "rb") as f:
            ...     response = client.chat("Summarize this", pdf_bytes=f.read())
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

        return completion(
            model=self.model.value,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            response_format={"type": "json_object"} if json_response else None,
        )
