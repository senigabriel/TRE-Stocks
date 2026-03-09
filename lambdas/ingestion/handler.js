const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");

const ddb = new DynamoDBClient({});

const TABLE_NAME = process.env.TABLE_NAME;
const API_KEY = process.env.MASSIVE_API_KEY;

const SYMBOLS = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA"];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function yyyymmdd(d) {
  return d.toISOString().split("T")[0];
}

function buildAggsUrl(symbol, from, to) {
  return `https://api.massive.com/v2/aggs/ticker/${encodeURIComponent(
    symbol
  )}/range/1/day/${from}/${to}?adjusted=true&sort=desc&limit=1&apiKey=${encodeURIComponent(
    API_KEY
  )}`;
}

async function writeWinnerToDynamo(winner) {
  await ddb.send(
    new PutItemCommand({
      TableName: TABLE_NAME,
      Item: {
        symbol: { S: winner.symbol },
        date: { S: winner.date },
        percentChange: { N: winner.percentChange.toString() },
        closePrice: { N: winner.closePrice.toString() },
      },
    })
  );
}

async function fetchLatestBarInWindow(symbol, from, to) {
  const url = buildAggsUrl(symbol, from, to);
  const res = await fetch(url);
  const raw = await res.text();

  if (!res.ok) return { ok: false, status: res.status, raw };

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ok: false, status: 0, raw: raw.slice(0, 200) };
  }

  const bar =
    Array.isArray(data.results) && data.results.length ? data.results[0] : null;
  if (!bar) return { ok: false, status: 200, raw: "No results" };

  const open = bar.o;
  const close = bar.c;
  const ts = bar.t;

  if (typeof open !== "number" || typeof close !== "number" || open === 0) {
    return { ok: false, status: 200, raw: "Invalid bar fields" };
  }

  const date = ts ? yyyymmdd(new Date(ts)) : to;
  const percentChange = ((close - open) / open) * 100;

  return {
    ok: true,
    symbol,
    date,
    closePrice: close,
    percentChange: Number(percentChange.toFixed(4)),
  };
}

async function pickWinnerForDate(targetDate) {
  const fromDate = new Date(targetDate);
  fromDate.setDate(fromDate.getDate() - 6);

  const from = yyyymmdd(fromDate);
  const to = targetDate;

  const candidates = [];

  for (const symbol of SYMBOLS) {
    console.log(`Fetching ${symbol} window ${from} -> ${to}`);

    const r = await fetchLatestBarInWindow(symbol, from, to);

    if (!r.ok) {
      if (r.status === 429) {
        console.warn(`429 on ${symbol}. Skipping symbol.`);
        await sleep(1200);
        continue;
      }
      console.warn(
        `API error ${symbol}:`,
        r.status,
        String(r.raw).slice(0, 160)
      );
      await sleep(700);
      continue;
    }

    candidates.push(r);
    await sleep(350);
  }

  if (!candidates.length) return { ok: false, message: `No data for ${targetDate}` };

  const winner = candidates.reduce((a, b) =>
    Math.abs(b.percentChange) > Math.abs(a.percentChange) ? b : a
  );

  return { ok: true, winner };
}

exports.handler = async (event = {}) => {
  if (!TABLE_NAME) throw new Error("TABLE_NAME missing");
  if (!API_KEY) throw new Error("MASSIVE_API_KEY missing");

  const backfillDates = Array.isArray(event.backfillDates)
    ? event.backfillDates
    : null;

  // Targeted-date backfill mode
  if (backfillDates && backfillDates.length) {
    const written = [];
    const skipped = [];

    for (const targetDate of backfillDates) {
      const res = await pickWinnerForDate(targetDate);

      if (!res.ok) {
        skipped.push({ date: targetDate, reason: res.message });
        continue;
      }

      // Guard: don’t write a different date than requested
      if (res.winner.date !== targetDate) {
        skipped.push({
          date: targetDate,
          reason: `API returned ${res.winner.date}`,
        });
        continue;
      }

      await writeWinnerToDynamo(res.winner);
      written.push(res.winner);

      await sleep(800);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        mode: "backfillDates",
        requested: backfillDates,
        writtenCount: written.length,
        skippedCount: skipped.length,
        written,
        skipped,
      }),
    };
  }

  // Normal daily run: attempt for today's date (window handles weekends/holidays)
  const today = yyyymmdd(new Date());
  const res = await pickWinnerForDate(today);

  if (!res.ok) {
    return { statusCode: 200, body: JSON.stringify({ message: "No data" }) };
  }

  await writeWinnerToDynamo(res.winner);

  return {
    statusCode: 200,
    body: JSON.stringify(res.winner),
  };
};
