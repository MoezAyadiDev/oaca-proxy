import https from "https";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST method is allowed" });
  }
  try {
    // Read POST JSON body
    const { typeTrafic, airport, date } = req.body ?? {};
    if (!typeTrafic || !codeAirport || !date) {
      return res.status(400).json({
        error: "Missing required fields: typeTrafic, codeAirport, date",
      });
    }
    const queryParam = {
      frmmvtCod: typeTrafic === "Arrival" ? "A" : "D",
      frmaeropVil: "-1",
      frmnumVol: "",
      frmairport: airport,
      frmhour: 0,
      frmday: date.getDate(),
      frmmonth: date.getMonth() + 1,
      frmacty: date.getFullYear(),
    };
    const urlApi = encodeQuery(queryParam);
    console.log(`${aeroport.url}?${urlApi}`);
    const targetUrl = `${aeroport.url}?${urlApi}`;
    // Disable TLS validation ONLY inside Vercel
    const agent = new https.Agent({
      rejectUnauthorized: false,
    });
    const response = await fetch(targetUrl, { agent });
    const body = await response.json();

    const apiResponse = body.map((item) => ({
      type: typeTrafic,
      formCodeAirport: typeTrafic === "Departure" ? "" : "",
      fromAirport: typeTrafic === "Departure" ? airport : item.direction,
      toCodeAirport: typeTrafic === "Arrival" ? "" : "",
      toAirport: typeTrafic === "Arrival" ? airport : item.direction,
      heure: item.heure,
      compagnie: item.compagnie,
      flightNum: item.numVol,
    }));

    res.setHeader("Content-Type", "application/json");
    res.status(200).send(apiResponse);
  } catch (er) {
    res.status(500).json({ error: err.message });
  }
}

function encodeQuery(data) {
  const ret = [];
  for (let d in data)
    ret.push(encodeURIComponent(d) + "=" + encodeURIComponent(data[d]));
  return ret.join("&");
}
