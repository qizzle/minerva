const Minerva = require("./main");

const min = new Minerva("game+showcase&sp=EgIQAg%253D%253D");

(async () => {
  await min.scrape(
    50000,
    5000,
    "./data/urls.txt",
    999999999999,
    "./data/denylist.json"
  );
})();
