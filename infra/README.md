# TRE Stocks

A serverless AWS application that tracks the top daily stock mover (by absolute % change) from a small watchlist and displays the last 7 days in a React frontend.

The system runs automatically each day and updates itself — no manual steps required.

---

## Live Demo

Frontend:
https://dtk6kfvddr9ic.cloudfront.net/

API:
https://tieppfn121.execute-api.us-east-1.amazonaws.com/prod/movers

---

## What This Project Does

Every day:

- EventBridge triggers a Lambda function
- The Lambda calls the Massive (Polygon) API
- It calculates percent change for each stock in the watchlist
- It selects the top absolute mover
- It stores that result in DynamoDB

The frontend then queries the last 7 days and displays:

- Date
- Symbol
- % change (color-coded)
- Closing price

---

## Architecture

EventBridge (scheduled daily)
→ Ingestion Lambda
→ DynamoDB (primary table + GSI)
→ API Gateway
→ Read Lambda
→ CloudFront + S3 React frontend

Everything is serverless.

No EC2. No containers.

---

## DynamoDB Design

Primary key:
- `symbol` (partition key)
- `date` (sort key)

GSI (GSI1):
- `date` (partition key)
- `symbol` (sort key)

Why?

Writes happen by symbol.
Reads happen by date.

This lets the API efficiently fetch “last 7 days” without scanning the table.

---

## Security Considerations

- Ingestion Lambda has write-only access to DynamoDB
- Read Lambda has read-only access
- API key is stored in environment variables (not committed)
- No direct frontend access to database
- No table scans (all queries use indexed access)

---

## Example Stored Record

```json
{
  "symbol": "AAPL",
  "date": "2026-02-27",
  "percentChange": -3.1634,
  "closePrice": 264.18
}
```

Only one top mover per day is stored.

---

## Backfill Support

The ingestion Lambda supports targeted backfills for specific trading days.

Example:

```bash
aws lambda invoke \
  --function-name IngestionStack-IngestionLambda... \
  --region us-east-1 \
  --cli-binary-format raw-in-base64-out \
  --payload '{"backfillDates":["2026-02-26","2026-02-23"]}' \
  output.json
```

This was helpful for seeding historical data during development.

---

## Some Challenges & Tradeoffs

### Trading days vs calendar days
Markets are closed on weekends and holidays.  
The system had to handle “no data” days gracefully and avoid writing incorrect dates.

### API rate limits
The Massive API enforces request limits.  
I added controlled delays and 429 handling to prevent Lambda timeouts.

### Avoiding duplicate dates
Backfills initially created multiple entries for the same date.  
The read Lambda now guarantees exactly one winner per date.

### Design choice: store only the daily winner
Instead of storing the full watchlist history, I chose to persist only the top mover for each day to keep the data model simple and aligned with the UI requirement.

---

## Future Improvements

- Store full daily watchlist history
- Add caching to reduce external API calls
- Add authentication
- Add monitoring and alerts
- Add automated tests

---

## Why I Built This

This project was built to demonstrate:

- Event-driven serverless architecture
- DynamoDB data modeling with GSIs
- Scheduled ingestion pipelines
- Clean separation between ingestion, read layer, and frontend
- Handling real-world API constraints

It’s fully automated and continues to update daily.
