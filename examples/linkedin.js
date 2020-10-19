import dotenv from "dotenv";
import puppeteer from "puppeteer";
import path from "path";
import OTPAuth from "otpauth";

dotenv.config();

const totp = new OTPAuth.TOTP({
  secret: process.env.TFA_SECRET,
});

(async () => {
  const browser = await puppeteer.launch({
    userDataDir: "./puppeteer",
    args: ["--no-sandbox"],
  });
  let page = await browser.newPage();
  try {
    console.log("Puppeteer launched");
    console.log("going to page");
    await page.goto(
      "https://www.linkedin.com/login?fromSignIn=true&trk=guest_homepage-basic_nav-header-signin"
    );
    await page.waitForSelector("#password");
    console.log("Entering username and password");
    await page.type("#username", process.env.LINKEDIN_USER);
    await page.type("#password", process.env.LINKEDIN_PASS);
    await page.click("button[type=submit]");
    console.log("waiting for verification page or home page");
    await page.waitFor(() =>
      document.querySelectorAll(
        "#two-step-submit-button,a[data-control-name=identity_network]"
      )
    );
    if (page.$("#two-step-submit-button")) {
      console.log("got verification page");
      let pinInput = await page.waitForSelector("input[name=pin]");
      console.log("entering pin");
      pinInput.type(totp.generate());
      await page.click("#two-step-submit-button");
      console.log("waiting for home page");
      await page.waitForSelector("a[data-control-name=identity_network]");
    } else if (page.$("a[data-control-name=identity_network]")) {
      console.log("got home page");
    } else {
      throw new Error("Unknown page");
    }

    console.log("going to search");
    await page.goto(
      "https://www.linkedin.com/search/results/people/?facetNetwork=%5B%22S%22%5D&origin=FACETED_SEARCH&title=CIO"
    );
    await page.waitForSelector(".search-feedback-card__container--top-divider");
    console.log("at search");
    //console.log(page.content());

    await browser.close();
  } catch (error) {
    console.error(error);
    await page.screenshot({ path: "screenshot.png" });
    const title = await page.title();
    console.log(`Now at page title: ${title}`);
    await browser.close();
  }
})();
