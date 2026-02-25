import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import fetch from "node-fetch";

const ddb = new DynamoDBClient({});
const TABLE_NAME = process.env.TABLE_NAME;
const API_KEY = process.env.MASSIVE_API_KEY;

const SYMBOLS = ["AAPL", "MSFT", "GOOGL", "AMZN"];

export const handler = async () => {
  console.log("Starting daily stock ingestion using Massive API");

  const results = [];

  for (const symbol of SYMBOLS) {
    const url = `https://api.massive.com/market/quote?symbol=${symbol}&apikey=${API_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    // Adjust field names if needed — depends on Massive response
    if (!data || !data.price || !data.changePercent) continue;

    results.push({
      symbol,
      price: data.price,
      changePercent: Number(data.changePercent),
      timestamp: new Date().toISOString(),
    });
  }

  if (!results.length) {
    throw new Error("No valid stock data returned");
  }

  const topMover = results.reduce((max, cur) =>
    cur.changePercent > max.changePercent ? cur : max
  );

  await ddb.send(
    new PutItemCommand({
      TableName: TABLE_NAME,
      Item: {
        symbol: { S: topMover.symbol },
        timestamp: { S: topMover.timestamp },
        price: { N: topMover.price.toString() },
        changePercent: { N: topMover.changePercent.toString() },
      },
    })
  );

  console.log("Stored top mover:", topMover);
  return topMover;
};
