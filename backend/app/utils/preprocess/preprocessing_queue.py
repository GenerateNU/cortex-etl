import asyncio
from uuid import UUID

from supabase import AsyncClient

from app.services.preprocess_service import PreprocessService


class PreprocessingQueue:
    def __init__(self, supabase: AsyncClient):
        self._queue = asyncio.Queue()
        self._worker_task = None
        self.service = PreprocessService(supabase)

    async def start_worker(self):
        """Start background worker"""
        if self._worker_task is None:
            self._worker_task = asyncio.create_task(self._worker())

    async def _worker(self):
        """Process items sequentially"""

        while True:
            extracted_file_id = await self._queue.get()
            try:
                print(f"Processing {extracted_file_id}", flush=True)
                await self.service.process_pdf_upload(extracted_file_id)
                print(f"Completed {extracted_file_id}", flush=True)
            except Exception as e:
                print(f"Failed {extracted_file_id}: {e}", flush=True)
            finally:
                self._queue.task_done()

    async def enqueue(self, file_upload_id: UUID) -> UUID:
        """Add to queue"""
        extracted_file_id = await self.service.created_queued_extraction(file_upload_id)
        await self._queue.put(extracted_file_id)
        return extracted_file_id


_queue: PreprocessingQueue | None = None


async def init_queue(supabase: AsyncClient):
    global _queue
    _queue = PreprocessingQueue(supabase)
    await _queue.start_worker()
    print("Preprocessing Queue Initialized")


def get_queue() -> PreprocessingQueue:
    assert _queue is not None
    print("Queue Found:", _queue)
    return _queue
