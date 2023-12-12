const puppeteer = require("puppeteer");
const fs = require("fs");

class Minerva {
  constructor(query) {
    this.query = query;
  }

  countFileLines(filePath) {
    return new Promise((resolve, reject) => {
      let lineCount = 0;
      fs.createReadStream(filePath)
        .on("data", (buffer) => {
          let idx = -1;
          lineCount--; // Because the loop will run once for idx=-1
          do {
            idx = buffer.indexOf(10, idx + 1);
            lineCount++;
          } while (idx !== -1);
        })
        .on("end", () => {
          resolve(lineCount);
        })
        .on("error", reject);
    });
  }

  async innerHTML(selected) {
    return await (await selected.getProperty("innerHTML")).jsonValue();
  }

  async _sub_count(info) {
    let sub_count = await info.$("#video-count");
    let final_sub_count = await this.innerHTML(sub_count);
    var number = final_sub_count.split(" ")[0].replace(".", "");
    if (number.includes("&nbsp;")) {
      number = +number.split("&nbsp;")[0].replace(",", ".") * 1000000;
    }
    return +number;
  }

  async _task(writer, page, limit, count, denyList, min) {
    let get_all_infos = await page.$$("#info");
    for (let info of get_all_infos) {
      let name = await info.$("#text");
      if (name === null) continue;
      let user_name = (await this.innerHTML(name)).split(" &amp")[0];

      let id = await info.$("#subscribers");
      let user_id = await this.innerHTML(id);
      if (denyList.includes(user_id)) continue;

      let user_subs = await this._sub_count(info);

      if (user_subs <= limit && user_subs >= min) {
        writer.write(
          `https://www.youtube.com/${user_id}      ${user_name}      ${user_subs} subs\n`
        );
      }
      denyList.push(user_id);
      console.log(
        user_name,
        user_subs,
        user_id,
        user_subs <= limit && user_subs >= min
      );
      count += 1;
    }
    return [count, denyList];
  }

  async scrape(limit, min, out, time, denylist) {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    var count = 0;
    const writer = fs.createWriteStream(out, { flags: "a" });
    const t_end = Date.now() + time * 1000;
    var t_now = Date.now();
    var denyList = JSON.parse(await fs.readFileSync(denylist));

    await page.goto(
      `https://www.youtube.com/results?search_query=${this.query}&sp=EgIQAg%253D%253D`
    );

    // Scraper
    while (t_now < t_end) {
      [count, denyList] = await this._task(
        writer,
        page,
        limit,
        count,
        denyList,
        min
      );
      t_now = Date.now();
      await page.evaluate(() => {
        window.scrollBy(0, window.innerHeight);
      });
      await fs.writeFileSync(denylist, JSON.stringify(denyList, null, 2));
    }
    //

    console.log("\nin total", count, "accounts scraped.");
    writer.end();
    await browser.close();
    let lines = await this.countFileLines(out);
    console.log("\nin total", lines, "accounts usable.");
  }
}

module.exports = Minerva;
