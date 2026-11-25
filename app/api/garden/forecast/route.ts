const endpoint = "https://api.open-meteo.com/v1/forecast?latitude=-41.51&longitude=173.95&daily=temperature_2m_min,temperature_2m_max&timezone=Pacific%2FAuckland&forecast_days=7";

export async function GET() {
  try {
    const response = await fetch(endpoint, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error("Forecast request failed.");
    const { daily } = await response.json();
    if (!Array.isArray(daily?.time) || !Array.isArray(daily.temperature_2m_min) || !Array.isArray(daily.temperature_2m_max)) {
      throw new Error("Forecast response is missing daily temperatures.");
    }
    const days = daily.time.slice(0, 7).flatMap((date: unknown, index: number) => {
      const min: unknown = daily.temperature_2m_min[index], max: unknown = daily.temperature_2m_max[index];
      return typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)
        && typeof min === "number" && Number.isFinite(min) && typeof max === "number" && Number.isFinite(max)
        ? [{ date, min, max }] : [];
    });
    if (!days.length) throw new Error("Forecast response contains no usable days.");
    return Response.json({ days });
  } catch {
    return Response.json({ days: [], unavailable: true }, { status: 503 });
  }
}
