"""Services package."""
# Fix for Python 3.10+ compatibility with ib_insync/eventkit
# Must be applied BEFORE importing ib_client
import asyncio
import sys
if sys.version_info >= (3, 10):
    try:
        asyncio.get_running_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

from .ib_client import IBClient, get_ib_client
from .supabase_service import SupabaseService, SupabaseServiceError, get_supabase_service
from .audit import AuditService, get_audit_service
