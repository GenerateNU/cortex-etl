# app/utils/queue.py
import asyncio
from uuid import UUID

from app.services.preprocess_service import get_preprocess_service


class ProcessingQueue:
    def __init__(self):
        self._queue = asyncio.Queue()
        self._worker_task = None

    async def start_worker(self):
        """Start background worker"""
        if self._worker_task is None:
            self._worker_task = asyncio.create_task(self._worker())

    async def _worker(self):
        """Process items sequentially"""

        service = get_preprocess_service()

        while True:
            file_upload_id = await self._queue.get()
            try:
                print(f"Processing {file_upload_id}", flush=True)
                await service.process_pdf_upload(file_upload_id)
                print(f"Completed {file_upload_id}", flush=True)
            except Exception as e:
                print(f"Failed {file_upload_id}: {e}", flush=True)
            finally:
                self._queue.task_done()

    async def enqueue(self, file_upload_id: UUID):
        """Add to queue"""
        await self._queue.put(file_upload_id)


processing_queue = ProcessingQueue()
