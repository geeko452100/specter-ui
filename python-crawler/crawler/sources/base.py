from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Iterable

from ..http_client import PoliteHTTPClient
from ..models import JobPosting


class JobSource(ABC):
    """One adapter per job data provider.

    Every adapter must only talk to a documented public API or feed meant
    for external consumption — see the module docstring in each concrete
    source for the specific documentation it's based on. HTML-scraping
    adapters are deliberately not included here; add one only after
    personally confirming the target site's robots.txt and Terms of Service
    allow it.
    """

    name: str

    @abstractmethod
    def fetch(self, client: PoliteHTTPClient) -> Iterable[JobPosting]:
        raise NotImplementedError
