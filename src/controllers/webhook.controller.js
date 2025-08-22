const crypto = require("crypto");
const Data = require("../models/Data");

function constantTimeEquals(a, b) {
  const aBuf = Buffer.from(a || "", "utf8");
  const bBuf = Buffer.from(b || "", "utf8");
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function computeHmacSignature(secret, rawBody) {
  return crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
}

exports.receiveElevenLabsWebhook = async (req, res) => {
  try {
    const secret = process.env.ELEVENLABS_WEBHOOK_SECRET;
    if (!secret) {
      return res.status(500).json({ error: "Webhook secret not configured" });
    }

    const signatureHeader =
      req.get("ElevenLabs-Signature") || req.get("X-ElevenLabs-Signature");
    if (!signatureHeader) {
      return res
        .status(401)
        .json({ error: "Missing ElevenLabs-Signature header" });
    }

    const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body || {}));
    const expected = computeHmacSignature(secret, rawBody);

    if (!constantTimeEquals(signatureHeader, expected)) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    const payloadToStore = {
      name: "webhook:elevenlabs",
      data: JSON.stringify({
        receivedAt: new Date().toISOString(),
        method: req.method,
        path: req.originalUrl,
        headers: req.headers,
        query: req.query,
        body: req.body,
      }),
    };

    const saved = await Data.create(payloadToStore);

    return res.status(200).json({ ok: true, id: saved._id.toString() });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Webhook error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.preCallElavenLabsWebhook = async (req, res, next) => {
  const newData = new Data({
    name: "Pre-Call Interaction",
    data: JSON.stringify({
      method: req.method, // capture request method (GET/POST/etc)
      query: req.query, // capture query params (for GET)
      body: req.body, // capture body (for POST)
      headers: req.headers, // ca
    }),
  });
  await newData.save();

  return res
    .status(200)
    .json({ message: "Webhook pre-call data saved successfully" });
};

exports.postCallElavenLabsWebhook = async (req, res, next) => {
  const newData = new Data({
    name: "Post-Call Interaction",
    data: JSON.stringify({
      method: req.method, // capture request method (GET/POST/etc)
      query: req.query, // capture query params (for GET)
      body: req.body, // capture body (for POST)
      headers: req.headers, // ca
    }),
  });
  await newData.save();

  return res
    .status(200)
    .json({ message: "Webhook pre-call data saved successfully" });
};

exports.toolCallElavenLabsWebhook = async (req, res, next) => {
  const newData = new Data({
    name: "Tool Interaction",
    data: JSON.stringify({
      method: req.method, // capture request method (GET/POST/etc)
      query: req.query, // capture query params (for GET)
      body: req.body, // capture body (for POST)
      headers: req.headers, // ca
    }),
  });
  await newData.save();

  return res
    .status(200)
    .json({ message: "Webhook pre-call data saved successfully" });
};
