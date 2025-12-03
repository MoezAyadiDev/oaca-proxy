export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST method is allowed" });
  }
  try {
    const autorisation = req.header("functionKey");
    if (autorisation !== process.env.FUNCTION_KEY) {
      return responseHandler(
        "Authentication Failed. Access to this resource requires valid credentials.",
        401
      );
    }

    // Read POST JSON body
    const { typeTrafic, airport, date } = req.body ?? {};
    if (!typeTrafic || !airport || !date) {
      return res.status(400).json({
        error: "Missing required fields: typeTrafic, airport, date",
      });
    }
    if (typeTrafic != "Arrival" && typeTrafic != "Departure") {
      return res.status(400).json({
        error: "Type traffic must be Arrival or Departure",
      });
    }
    if (!isDateValid(date)) {
      return res.status(400).json({
        error: "the date must be format YYYYMMDD",
      });
    }
    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
    const maDate = chaineToDate(date.toString());
    const queryParam = {
      frmmvtCod: typeTrafic === "Arrival" ? "A" : "D",
      frmaeropVil: "-1",
      frmnumVol: "",
      frmairport: airport,
      frmhour: 0,
      frmday: maDate.getDate(),
      frmmonth: maDate.getMonth() + 1,
      frmacty: maDate.getFullYear(),
    };
    const urlApi = encodeQuery(queryParam);
    const airportUrl = "https://www.oaca.nat.tn/vols/api/flight/filter";
    const targetUrl = `${airportUrl}?${urlApi}`;
    // Disable TLS validation ONLY inside Vercel
    // const agent = new https.Agent({
    //   rejectUnauthorized: false,
    // });
    // const response = await fetch(targetUrl, { agent });
    const response = await fetch(targetUrl);
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
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
}

function encodeQuery(data) {
  const ret = [];
  for (let d in data)
    ret.push(encodeURIComponent(d) + "=" + encodeURIComponent(data[d]));
  return ret.join("&");
}

function chaineToDate(madate) {
  return new Date(
    Number(madate.substring(0, 4)),
    Number(madate.substring(4, 6)) - 1,
    Number(madate.substring(6))
  );
}

function isDateValid(value) {
  try {
    const str = value.toString();

    // Must be exactly 8 digits
    if (!/^\d{8}$/.test(str)) return false;

    const year = parseInt(str.substring(0, 4), 10);
    const month = parseInt(str.substring(4, 6), 10);
    const day = parseInt(str.substring(6, 8), 10);

    // Basic checks
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;

    // Construct date object
    const date = new Date(year, month - 1, day);

    // Validate by checking that components match
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  } catch {
    return false;
  }
}
