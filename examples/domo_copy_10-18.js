import puppeteer from "puppeteer";

(async () => {
  const browser = await puppeteer.launch({
    userDataDir: "./puppeteer",
    args: ["--no-sandbox"],
    headless: false,
    // slowMo: 5,
  });
  let page = await browser.newPage();
  try {
    await page.goto("https://tbicom.domo.com/auth");
    await page.waitForSelector("a[class=ng-binding]");
    await page.click("a[class=ng-binding]");
    await page.waitForSelector("input[name=password]");
    await page.type("input[name=username]", "clacaille@tbicom.com");
    await page.type("input[name=password]", "Saitek150?");
    await page.click("button[name=submit]");
    await page.waitForSelector("div[app-info=appInfo]");
    await page.goto("https://tbicom.domo.com/page/381261777");
    // await page.waitFor(3000);
    // console.log('waiting for "share" icon...');
    // page.$eval(".icon-arrow-box _24", (elem) => elem.click());
    // await page.waitFor(3000);
    console.log("finding dropdown button for filters");

    const filtersDropdownSelector =
      // "body.bodyClass.nc2.i18n-en.buzz-is-sidebar.clickup-chrome-ext_installed.badgePage:nth-child(5) div.app:nth-child(1) div.app-banner-container.ng-scope div.app-wrapper:nth-child(2) div.app-content div.app-body div.app-body-main.sticky-header.layout-page div.app-body-main-view.ng-scope div.cardpage-main.ng-scope.page-sticky-header.has-layouts div.ng-scope.page-main-header.full-width-minus-domotalk div.ng-scope.page-analyzer-for-page-layout.page-analyzer-for-sticky-headers div.sticky-header dm-page-filters.ng-isolate-scope cmpobac4545eo.ng-isolate-scope fb-filter-builder.ng-scope.ng-isolate-scope.dm-page-filters_filterBuilderReducePadding_2kZXZ div.fb-filter-builder_container_1s791.filter-builder-container div.fb-filter-builder_contentContainer_lWI7u fb-header.ng-scope.ng-isolate-scope div.fb-header_container_RS_B9 fb-header-text.ng-isolate-scope:nth-child(1) div.fb-header-text_container_3ghEO div.fb-header-text_filterLabel_1CxBN.ng-scope > div.ng-binding.ng-scope";
    // "button.dm-page-analyzer-summary-text__toggle-button.db-button";
    "button.dm-page-analyzer-summary-text__toggle-button.db-button";

    const [dropdown] = await page.waitForSelector(filtersDropdownSelector);
    if (dropdown) {
      await page.click(filtersDropdownSelector);
      console.log("filters dropdown clicked");
    }
    console.log("filters opening or opened");

    console.log('Finding "Filters" header text');
    const filtersTitleXPath = "//fb-header-text/div[1]/div[1]/div[1]";
    // "//div[contains(., 'Filters')]"
    await page.waitForXPath(filtersTitleXPath);
    const [filters] = await page.$x(filtersTitleXPath);
    console.log("filters text: ", filters);
    if (filters) console.log('"Filters" header text found');
    //   await filters.click()
    // }

    const partnerFilterXPath =
      "//body/div[1]/div[1]/div[1]/div[1]/div[2]/div[1]/div[2]/div[1]/div[1]/div[3]/div[1]/dm-page-filters[1]/cmpobac4545eo[1]/div[1]/fb-filter-builder[1]/div[1]/div[1]/div[1]/div[1]/fb-filter-list[1]/div[1]/div[1]/div[1]/fb-filter-tile[1]/fb-tile[1]/div[1]/div[1]/ng-transclude[1]/span[1]";
    // const partnerFilterSelector =
    //   "body.bodyClass.nc2.i18n-en.buzz-is-sidebar.clickup-chrome-ext_installed.badgePage:nth-child(5) div.app:nth-child(1) div.app-banner-container.ng-scope div.app-wrapper:nth-child(2) div.app-content div.app-body div.app-body-main.sticky-header.layout-page div.app-body-main-view.ng-scope div.cardpage-main.ng-scope.page-sticky-header.has-layouts div.ng-scope.page-main-header.full-width-minus-domotalk div.ng-scope.page-analyzer-for-page-layout.page-analyzer-for-sticky-headers div.sticky-header dm-page-filters.ng-isolate-scope cmpobac4545eo.ng-isolate-scope fb-filter-builder.ng-scope.ng-isolate-scope.dm-page-filters_filterBuilderReducePadding_2kZXZ div.fb-filter-builder_container_1s791.filter-builder-container div.fb-filter-builder_contentContainer_lWI7u div.fb-filter-builder_content_2MXAo.fb-filter-builder-content-container.ng-scope.fb-filter-builder_contentWithFilters_3x-Zn div.fb-filter-builder_verticalLayout_33Ga4 fb-filter-list.ng-isolate-scope div.fb-filter-list_container_6QkzX div.fb-filter-list_filterList_Uwooe div.ng-scope:nth-child(3) fb-filter-tile.ng-isolate-scope fb-tile.ng-isolate-scope div.fb-tile div.fb-tile__content ng-transclude:nth-child(1) > span.fb-filter-tile__click-to-filter-text.ng-scope";
    // // console.log('Waiting for selectors...')
    // // await page.waitForSelector('span.fb-tile__column-name.ng-binding.ng-isolate-scope')
    console.log("page.waitForXPath(partnerFilterXPath)");
    await page.waitForXPath(partnerFilterXPath);
    const [span] = await page.$x(partnerFilterXPath);
    console.log("Partner xpath clicked");
    // await page.waitForSelector(partnerFilterSelector)
    // await page.click(partnerFilterSelector)
    // console.log("Partner selector clicked");

    // await page.waitForXPath("//span[contains(., 'Partner Name')]");
    // const span = await page.$x("//span[contains(., 'Partner Name')]");
    // console.log("partner span: ", span);
    // if (span) {
    //   console.log("Partner span found");
    //   console.log("span: ", span);
    //   await span.click();
    //   console.log("Partner span clicked");
    // }
    // await page.waitForNavigation();

    // await page.waitForSelector('div[class="fb-tile"] > ');

    // const getThemAll = await page.$$("i.icon-arrow-box _24");
    // getThemAll.forEach(async (link) => {
    //   await page.evaluate(() => link.click());
    // });

    const [div] = await page.$x("//div[contains(., 'Export as PDF')]");
    console.log("Export as PDF DIV: ", div);
    if (div) {
      await div.click();
    }

    console.log("Export Download DIV: ", div);
    await page.waitForSelector("button[class=export-download]", {
      //   TODO update to X mins
      timeout: 0,
    });
    const [response] = await Promise.all([
      page.waitForNavigation(),
      await page.click("button[class=export-download]"),
    ]);

    await browser.close();
  } catch (error) {
    console.error(error);
    await page.screenshot({ path: "screenshot.png" });
    const title = await page.title();
    console.log(`Now at page title: ${title}`);
    await browser.close();
  }
})();
