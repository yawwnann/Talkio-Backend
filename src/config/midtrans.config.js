const midtransClient = require("midtrans-client");

let snap = null;

const initializeMidtrans = () => {
  if (snap) return snap;

  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";

  snap = new midtransClient.Snap({
    isProduction,
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY,
  });

  console.log(`Midtrans initialized in ${isProduction ? "production" : "sandbox"} mode`);
  return snap;
};

module.exports = {
  initializeMidtrans,
  THERAPY_PRICE: 165000,
};
