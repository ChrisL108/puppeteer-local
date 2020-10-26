import dotenv from "dotenv";
dotenv.config();
import puppeteer from "puppeteer";
import fetch from "isomorphic-unfetch";
import fs from "fs";

(async () => {
  const browser = await puppeteer.launch({
    userDataDir: "./puppeteer",
    // args: ["--no-sandbox"],
    // dumpio: true,
    headless: false,
    slowMo: 5,
    timeout: 0,
  });
  let page = await browser.newPage();
  let pageContent;
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
    await page.goto(process.env.customerInsights);

    console.log("finding dropdown button for filters");

    const TEST_PARTNER = "CDW Logistics";
    const filterPartnerNameXPath =
      "//fb-tile[1]/div[1]/span[contains(., 'Partner')]";
    const filterPartnerNameSelector =
      "input[placeholder='Filter by...']:nth-child(1)";

    const filtersClose = "i[class='icon-chevron-up']";
    const filtersOpen = "i.ng-scope.icon-chevron-down";

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
      try {
        const openFilters = await page.waitForSelector(filtersOpen);
        openFilters.click();
      } catch (error) {
        console.log(
          'ERROR FINDING "open filters" button: ',
          JSON.stringify(error)
        );
      }
    }
    await page.waitForTimeout(2500);

    // TODO REMOVE ------------------
    // await browser.close();
    // return;
    // TODO REMOVE ------------------

    console.log("Opening Partner Name filter...");
    const partnerFilter = await page.waitForXPath(filterPartnerNameXPath, {
      // timeout: 0,
    });
    // const partnerFilter = await page.$x(filterDropdownXPath)
    if (partnerFilter) {
      await partnerFilter.click();
      console.log("Selecting Partner Name text field...");
      const filterInputName = await page.waitForSelector(
        filterPartnerNameSelector
      );
      // const filterInputName = await page.waitForXPath(filterPartnerNameXPath)
      if (filterInputName) {
        console.log("Typing in Partner Name text field...");
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

        // // TODO remove early exit
        // // TODO remove early exit
        // res.send('done')
        // await browser.close()
        // return
        // // TODO remove early exit
        // // TODO remove early exit
        try {
          console.log("starting CDP session 1...");
          // handleCdpSession(page, 1, resolve, browser)
          let body;
          const client = await page.target().createCDPSession();
          await client.send("Fetch.enable", {
            patterns: [
              {
                urlPattern: "*",
                requestStage: "Response",
              },
            ],
          });
          await client.on("Fetch.requestPaused", async (reqEvent) => {
            const {
              requestId,
              request: { url },
              resourceType,
            } = reqEvent;
            let responseHeaders = reqEvent.responseHeaders || [];
            let contentType = "";
            // console.log('reqEvent: ', reqEvent)
            for (let element of responseHeaders) {
              if (element.name.toLowerCase() === "content-type") {
                console.log("content-type FOUND");
                contentType = element.value;
                break;
              }
            }
            // console.log('contentType: ', contentType)
            // console.log('contentType.includes("application/pdf"): ', contentType.includes('application/pdf'))

            // if (true) {
            if (url.includes("/export")) {
              // if (contentType.includes('application/pdf')) {
              // console.log('resourceType: ', resourceType)
              // console.log('responseHeaders: ', Object.keys(responseHeaders))
              // console.log('PDF Request found, reqEvent: ', reqEvent)
              responseHeaders.push({
                name: "content-disposition",
                value: "attachment",
              });

              const responseObj = await client.send("Fetch.getResponseBody", {
                requestId,
              });
              console.log(
                "PDF responseObj (first 200) BEFORE AWAIT: ",
                JSON.stringify(responseObj).substring(0, 200)
              );

              body = await responseObj.body;

              await client.send("Fetch.fulfillRequest", {
                requestId,
                responseCode: 200,
                responseHeaders,
                body: responseObj.body,
              });
              if (body.length > 1) {
                // console.log('session: ', session)
                console.log("url: ", url);
                console.log(
                  "PDF responseObj (first 200): ",
                  JSON.stringify(responseObj).substring(0, 200)
                );
                console.log(
                  "PDF body (first 200): ",
                  JSON.stringify(body).substring(0, 200)
                );
                // resolve(body)
                res.send(body);
                await browser.close();
              }
              // resolve(body)
            } else {
              await client.send("Fetch.continueRequest", { requestId });
            }
          });
        } catch (error) {
          console.log("ERROR HANDLING CDP SESSION 1: ", JSON.stringify(error));
        }

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
        }

        // try {
        //   console.log('starting CDP session 2...')
        //   handleCdpSession(page, 2)
        // } catch (error) {
        //   console.log('ERROR HANDLING CDP SESSION 2: ', JSON.stringify(error))
        // }

        await page.waitForTimeout(5000);

        const pages = await browser.pages();

        console.log("# of pages: ", pages.length);
        for (let page of pages) {
          console.log(`page URL: ${page.url()}`);
        }

        await page.goto(pages[pages.length - 1].url(), {
          waitUntil: "networkidle0",
        });
        await page.waitForTimeout(2000);
        // await page.emulateMediaType("screen");
        // try {
        //   // await page.emulateMediaType('screen')
        //   await page.pdf({ path: 'html-page.pdf', format: 'A4' })
        // } catch (error) {
        //   console.error('error generating pdf: ', JSON.stringify(error))
        // }
        pageContent = await page.content();
        await page.waitForTimeout(2000);
        // res.send(pageContent)
        // console.log('pageContent: ', pageContent.substring(0, 150))
        // res.send(pageContent)

        //TODO  https://stackoverflow.com/questions/56254177/open-puppeteer-with-specific-configuration-download-pdf-instead-of-pdf-viewer

        // const pdfFetch = await fetch(pages[pages.length - 1].url(), {
        //   credentials: 'same-origin',
        //   // headers: {
        //   //   "Content-Type": "application/pdf",
        //   // },
        // })
        // const pdfData = await pdfFetch.text()
        // console.log(pdfData.substring(0, 500))
        // res.send(pdfData)

        // res.send('done')
      }
    }

    // await browser.close()
    // res.send(pageContent)
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
