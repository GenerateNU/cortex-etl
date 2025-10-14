# utils.py
import re
from typing import Optional, List, Dict, Any

# Cleans extracted text from a pdf
def _collapse_ws(s: Optional[str]) -> Optional[str]:
    ...

# Detects unit or symbol fragments in PDF tables, so that they can be merged with the number their associated with
def _is_symbol_shard_cell(s: Optional[str]) -> bool:
    ...

# Takes a table extarcted from a PDF and cleans it by removing empty rows and columns
def _clean_table(rows: List[List[Optional[str]]]) -> Optional[Dict[str, Any]]:
    ...