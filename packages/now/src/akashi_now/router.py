"""HTTP routes for live-facts (mounted under /now; paths here are prefix-free)."""

from anyio import to_thread
from fastapi import APIRouter

from akashi_core.constants.app import SERVICE_NOW
from akashi_core.constants.deadlines import NOW_DEADLINE_S
from akashi_core.contract.build import build_envelope
from akashi_core.contract.envelope import Envelope
from akashi_core.deadline import current_deadline
from akashi_now.facts.models import FactRequest, FactResult
from akashi_now.facts.service import get_fact
from akashi_now.fx.models import FxRequest, FxResult
from akashi_now.fx.service import get_fx
from akashi_now.holidays.models import BusinessDaysRequest, BusinessDaysResult, HolidayResult, HolidaysRequest
from akashi_now.holidays.service import business_days, get_holidays
from akashi_now.jobs.models import Job, JobsRequest
from akashi_now.jobs.service import get_jobs
from akashi_now.news.models import NewsRequest, NewsStory
from akashi_now.news.service import get_news
from akashi_now.stocks.models import StockQuote, StocksRequest
from akashi_now.stocks.service import get_stocks
from akashi_now.time.models import TimeRequest, TimeResult
from akashi_now.time.service import get_time
from akashi_now.weather.models import WeatherRequest, WeatherResult
from akashi_now.weather.service import get_weather

router = APIRouter(prefix="/v1")


@router.post("/time")
async def time(body: TimeRequest) -> Envelope[TimeResult]:
    deadline = current_deadline(NOW_DEADLINE_S)
    result, sources = await get_time(body)
    return build_envelope(
        service=SERVICE_NOW,
        operation="time",
        deadline=deadline,
        results=[result],
        sources=sources,
        unavailable=[s.name for s in sources if s.status == "unavailable"],
        summary_field="kind",
    )


@router.post("/holidays")
async def holidays(body: HolidaysRequest) -> Envelope[HolidayResult]:
    deadline = current_deadline(NOW_DEADLINE_S)
    results, sources, unavailable = await get_holidays(body)
    return build_envelope(
        service=SERVICE_NOW,
        operation="holidays",
        deadline=deadline,
        results=results,
        sources=sources,
        unavailable=unavailable,
        summary_field="kind",
    )


@router.post("/business-days")
async def business_days_route(body: BusinessDaysRequest) -> Envelope[BusinessDaysResult]:
    deadline = current_deadline(NOW_DEADLINE_S)
    result = await to_thread.run_sync(business_days, body)  # calendars are computed in Python: keep the loop free
    return build_envelope(
        service=SERVICE_NOW,
        operation="business-days",
        deadline=deadline,
        results=[result],
        sources=[],
        unavailable=[],
        summary_field="kind",
    )


@router.post("/fx")
async def fx(body: FxRequest) -> Envelope[FxResult]:
    deadline = current_deadline(NOW_DEADLINE_S)
    results, sources, unavailable = await get_fx(body)
    return build_envelope(
        service=SERVICE_NOW,
        operation="fx",
        deadline=deadline,
        results=results,
        sources=sources,
        unavailable=unavailable,
        summary_field="kind",
    )


@router.post("/weather")
async def weather(body: WeatherRequest) -> Envelope[WeatherResult]:
    deadline = current_deadline(NOW_DEADLINE_S)
    result, sources, unavailable = await get_weather(body)
    return build_envelope(
        service=SERVICE_NOW,
        operation="weather",
        deadline=deadline,
        results=[result] if result else [],
        sources=sources,
        unavailable=unavailable,
        summary_field="kind",
    )


@router.post("/fact")
async def fact(body: FactRequest) -> Envelope[FactResult]:
    deadline = current_deadline(NOW_DEADLINE_S)
    result, sources = await get_fact(body)
    return build_envelope(
        service=SERVICE_NOW,
        operation="fact",
        deadline=deadline,
        results=[result],
        sources=sources,
        unavailable=[],
        summary_field="kind",
    )


@router.post("/news")
async def news(body: NewsRequest) -> Envelope[NewsStory]:
    deadline = current_deadline(NOW_DEADLINE_S)
    results, sources, unavailable, notes = await get_news(body)
    return build_envelope(
        service=SERVICE_NOW,
        operation="news",
        deadline=deadline,
        results=results,
        sources=sources,
        unavailable=unavailable,
        summary_field="source",
        notes=notes,
    )


@router.post("/stocks")
async def stocks(body: StocksRequest) -> Envelope[StockQuote]:
    deadline = current_deadline(NOW_DEADLINE_S)
    results, sources, unavailable, notes = await get_stocks(body)
    return build_envelope(
        service=SERVICE_NOW,
        operation="stocks",
        deadline=deadline,
        results=results,
        sources=sources,
        unavailable=unavailable,
        summary_field="status",
        notes=notes,
    )


@router.post("/jobs")
async def jobs(body: JobsRequest) -> Envelope[Job]:
    deadline = current_deadline(NOW_DEADLINE_S)
    results, sources, unavailable, notes = await to_thread.run_sync(get_jobs, body)
    return build_envelope(
        service=SERVICE_NOW,
        operation="jobs",
        deadline=deadline,
        results=results,
        sources=sources,
        unavailable=unavailable,
        summary_field="ats",
        notes=notes,
    )
