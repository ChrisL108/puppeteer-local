import dotenv from "dotenv";
dotenv.config();
import puppeteer from "puppeteer";
import fetch from "isomorphic-unfetch";
import fs from "fs";

(async () => {
  let currPageUrl;
  const browser = await puppeteer.launch({
    // userDataDir: "./puppeteer",
    // args: ["--no-sandbox"],
    // dumpio: true,
    headless: false,
    slowMo: 5,
    timeout: 0,
  });
  let page = await browser.newPage();

  /**
   ** EVENT HANDLERS
   */
  // browser.on("targetchanged", (e) => {
  //   console.log("browser target changed, e: ", e);
  //   currPageUrl = e.url();
  // });

  // await page.setRequestInterception(true);
  let requestUrl;
  page.on("request", (request) => {
    requestUrl = request.url();
    if (requestUrl.includes("pdf"))
      console.log('on("request"), pdf request.url()');
    // return;
  });

  try {
    // await page._client.send("Page.setDownloadBehavior", {
    //   behavior: "allow",
    //   downloadPath: "./reports",
    // });

    await page.goto("https://tbicom.domo.com/auth");
    await page.waitForSelector("a[class=ng-binding]");
    await page.click("a[class=ng-binding]");
    await page.waitForSelector("input[name=password]");
    await page.type("input[name=username]", process.env.domo_user);
    await page.type("input[name=password]", process.env.domo_password);
    await page.click("button[name=submit]");
    await page.waitForSelector("div[app-info=appInfo]");
    await page.goto(process.env.domo_page_insights, { timeout: 45000 });

    console.log("finding dropdown button for filters");

    const TEST_PARTNER = "CDW Logistics";
    const filterDropdownXPath =
      "//fb-tile[1]/div[1]/span[contains(., 'Partner')]";
    const filterPartnerNameSelector =
      "input[placeholder='Filter by...']:nth-child(1)";

    const filtersClose = "i[class='icon-chevron-up']";
    const filtersOpen = "i.ng-scope.icon-chevron-down";
    // const filtersOpen = "i[class='icon-chevron-down']";

    const filtersOpenButton = await page.waitForSelector(filtersOpen);
    // const filtersCloseButton = await page.waitForSelector(filtersClose, {
    //   timeout: 2000,
    // });
    // if (!filtersCloseButton) {
    //   console.log("Opening filters...");
    //   const openFilters = await page.waitForSelector(filtersOpen);
    //   openFilters.click();
    // }
    if (filtersOpenButton) {
      console.log("Opening filters...");
      const openFilters = await page.waitForSelector(filtersOpen);
      openFilters.click();
      await page.waitForTimeout(2500);
    }

    // TODO REMOVE ------------------
    // await browser.close();
    // return;
    // TODO REMOVE ------------------

    const partnerFilter = await page.waitForXPath(filterDropdownXPath, {
      // timeout: 0,
    });
    // const partnerFilter = await page.$x(filterDropdownXPath)
    if (partnerFilter) {
      await partnerFilter.click();
      console.log("partner filter dropdown clicked");
      const filterInputName = await page.waitForSelector(
        filterPartnerNameSelector
      );
      // const filterInputName = await page.waitForXPath(filterPartnerNameXPath)
      if (filterInputName) {
        console.log("filter input box found");
        await page.type(filterPartnerNameSelector, TEST_PARTNER);

        // wait for filtered results to populate
        await page.waitForTimeout(5000);

        // select first result
        await page.keyboard.press("Tab");
        await page.keyboard.press("Tab");
        await page.keyboard.press("Space");
        await page.keyboard.press("Enter");

        // wait for partner filter to be applied
        await page.waitForTimeout(7000);

        const shareIcon = await page.waitForSelector(
          'i[class="icon-arrow-box _24"'
        );
        await shareIcon.click();

        const exportButton = await page.waitForXPath(
          "//div[contains(text(),'Export as PDF')]"
        );
        exportButton.click();
        // await page.waitForTimeout(15000);
        // await page.waitForTimeout(1000);

        const downloadButton = await page.waitForXPath(
          "//button[contains(text(),'Download')]",
          {
            timeout: 0,
          }
        );
        await page.waitForTimeout(1000);
        if (downloadButton) {
          console.log("downloadButton found!");
          await downloadButton.click();
          // TODO test event: 'popup'
          // const [response] = await Promise.all([
          //   page.waitForNavigation(), // This will set the promise to wait for navigation events
          //   await downloadButton.click(), // After clicking the submi
          //   // Then the page will be send POST and navigate to target page
          // ]);
          // console.log("Promise.all() response: ", response);
        }

        // await page.waitForNavigation({
        //   waitUntil: "load",
        // });
        await page.waitForTimeout(5000);

        // await page.emulateMediaType("screen");
        const pages = await browser.pages();

        // await page.tab
        // await page.pdf({ path: "html-page.pdf", format: "A4" });
        console.log("# of pages: ", pages.length);
        console.log("last page url: ", pages[pages.length - 1].url());
        // const currPdfUrl = page.url();
        // console.log("initial page url: ", currPdfUrl);
        // console.log("targetchanged page url: ", currPageUrl);

        await page.goto(pages[pages.length - 1].url());
        // await page.emulateMediaType("screen");
        // await page.pdf({ path: "html-page.pdf" });
        const pageContent = await page.content();

        console.log('pageContent: ', pageContent);
        res.send(pageContent)

        // const pdfFetch = await fetch(pages[pages.length - 1].url(), {
        //   credentials: "include",
        //   headers: {
        //     "Content-Type": "application/pdf",
        //   },
        // });
        // const pdfData = await pdfFetch.text();
        // console.log(pdfData.substring(0, 500));
      }
    }

    await browser.close();
  } catch (error) {
    console.error(error);
    await page.screenshot({ path: "screenshot.png" });
    const title = await page.title();
    console.log(`Now at page title: ${title}`);
    await browser.close();
  }
})();

/**
 *
 * @param {any} page
 * @param {string} url
 * @param {string} fullpath
 */
async function downloadImage(page, url, fullpath) {
  const data = await page.evaluate(
    // tslint:disable-next-line no-shadowed-variable
    async ({ url }) => {
      function readAsBinaryStringAsync(blob) {
        return new Promise((resolve, reject) => {
          const fr = new FileReader();
          fr.readAsBinaryString(blob);
          fr.onload = () => {
            resolve(fr.result);
          };
        });
      }

      const r = await fetch(url, {
        credentials: "include",
        headers: {
          accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp, */*;q=0.8",
          "cache-control": "no-cache",
          pragma: "no-cache",
          "sec-fetch-mode": "navigate",
          "sec-fetch-site": "same-site",
          "upgrade-insecure-requests": "1",
        },
        referrerPolicy: "no-referrer-when-downgrade",
        body: null,
        method: "GET",
        mode: "cors",
      });

      return await readAsBinaryStringAsync(await r.blob());
    },
    { url }
  );

  fs.writeFileSync(fullpath, data, { encoding: "binary" });
}
