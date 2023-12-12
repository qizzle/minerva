const Minerva = require("./main");

const min = new Minerva("game");

(async () => {
  await min.scrape(
    50000,
    1000,
    "./data/urls.txt",
    999999999999,
    "./data/denylist.json"
  );
})();
