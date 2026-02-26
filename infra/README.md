**TRE Stocks – Serverless Stock Movers Dashboard**

This project implements a serverless, event-driven stock tracking pipeline using AWS.
It ingests daily stock data, identifies the top price mover, and stores the result for later retrieval via an API and dashboard.

The design emphasizes automation, scalability, security best practices, and clean separation of concerns, aligned with real-world cloud infrastructure patterns.

🏗️ **High-Level Architecture:**

- EventBridge triggers a scheduled ingestion job once per day

- Ingestion Lambda fetches stock data from a provided external API

- The Lambda computes daily percentage changes and selects the top mover

- Results are stored in DynamoDB

- A Read API will expose the data via GET /movers

- A frontend dashboard can visualize the results


⚙️ **Infrastructure Components:**

EventBridge

- Schedules the ingestion job once per day

- Runs after U.S. market close to ensure finalized data

- Fully serverless (no cron servers)

Ingestion Lambda

- Fetches stock data from the provided Massive stock tracking API

- Computes daily percentage change for a defined set of symbols

- Selects the top mover

- Writes a single normalized record to DynamoDB

DynamoDB

- Stores the daily top mover

- Designed for fast reads and low operational overhead

- Partitioned for future query expansion

IAM

- Uses least-privilege access

- Ingestion Lambda has write-only permissions to the table

- No hardcoded secrets or credentials


📊 Watched Stocks

This project tracks a predefined set of stocks specified in the project requirements.
Only these symbols are considered when identifying Winning Stocks during ingestion.

Example watched symbols:

AAPL
MSFT
NVDA
AMZN
GOOGL
META
TSLA

The ingestion Lambda fetches daily market data, filters for these symbols, determines daily “winners,” and stores the results in DynamoDB.

This ensures: 

Consistent analysis

Predictable dataset size

Clear alignment with project specs

🧠 **Data Flow Overview**

1. EventBridge (Daily @ Market Close)

  Triggers ingestion Lambda

2. Ingestion Lambda

  Calls external stock API

  Filters for watched symbols

  Determines daily winners

  Writes results to DynamoDB (date = partition key)

3. Read API (GET /movers)

  Queries DynamoDB

  Returns last 7 days of winning stocks

  No authentication required

4. Frontend 

  Calls Read API

  Visualizes trends & winners

📡 API – Get Winning Stocks

Endpoint:

GET /movers

Description:
Returns all winning stocks from the last 7 days, aggregated from DynamoDB.

✅ Sample Response
{
  "range": "last_7_days",
  "days": 7,
  "count": 0,
  "data": []
}

When data exists:

{
  "range": "last_7_days",
  "days": 7,
  "count": 5,
  "data": [
   {
      "date": "2026-02-25",
      "symbol": "NVDA",
      "changePercent": 3.42
    }
  ]
}
🛠 **Tech Stack**

- Infrastructure: AWS CDK (TypeScript)

- Compute: AWS Lambda (Node.js 20)

- Database: DynamoDB

- API: API Gateway (REST)

- Frontend: React + charting library
