import type { VercelRequest, VercelResponse } from "@vercel/node";

const FEED_URL = "http://www.aaronsw.com/2002/feeds/pgessays.rss";

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const response = await fetch(FEED_URL);
  const xml = await response.text();
  res.setHeader("Content-Type", "application/xml");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.send(xml);
}
