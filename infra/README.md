TRE Stocks – Serverless Stock Movers Dashboard

This project implements a serverless, event-driven stock tracking pipeline using AWS.
It ingests daily stock data, identifies the top price mover, and stores the result for later retrieval via an API and dashboard.

The design emphasizes automation, scalability, security best practices, and clean separation of concerns, aligned with real-world cloud infrastructure patterns.

🏗️ High-Level Architecture:

- EventBridge triggers a scheduled ingestion job once per day

- Ingestion Lambda fetches stock data from a provided external API

- The Lambda computes daily percentage changes and selects the top mover

- Results are stored in DynamoDB

- A Read API will expose the data via GET /movers

- A frontend dashboard can visualize the results


⚙️ Infrastructure Components:

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
