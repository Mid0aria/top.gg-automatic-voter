/*
 * OwO Farm Bot Stable / https://github.com/Mid0aria/owofarmbot_stable/blob/main/utils/autovote.js
 * Copyright (C) 2024 Mido
 * This software is licensed under Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International
 * For more information, see README.md and LICENSE
 */

/*
 * autovoter for top.gg
 */

const packageJson = require("./package.json");
const cp = require("child_process");

for (let dep of Object.keys(packageJson.dependencies)) {
    try {
        require.resolve(dep);
    } catch (err) {
        console.log("Installing dependencies...");
        cp.execSync(`npm i`);
    }
}

const { connect } = require("puppeteer-real-browser");
const yargs = require("yargs");
const argv = yargs.options({
    token: {
        alias: "t",
        describe: "User token",
        type: "string",
        demandOption: true,
    },
    botid: {
        alias: "bid",
        describe: "Id of the bot to vote for",
        type: "string",
        demandOption: true,
    },
}).argv;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
    const topcici = "https://top.gg";
    const { token, botid } = argv;

    const { browser, page } = await connect({
        headless: false,
        turnstile: true,
        plugins: [
            require("puppeteer-extra-plugin-adblocker")({
                blockTrackers: true,
                useCache: true,
                cacheDir: path.resolve(__dirname, "./adblockcache"),
            }),
        ],
    });
    await page.setViewport({
        width: 1920,
        height: 1080,
    });

    await page.evaluateOnNewDocument((token) => {
        window.localStorage.setItem("token", `"${token}"`);
    }, token);

    await page.goto(topcici, { waitUntil: "load" });
    await page.waitForSelector(".chakra-button.css-7rul47", { visible: true });
    await page.locator(".chakra-button.css-7rul47").setTimeout(3000).click();

    //discord auth
    await page.waitForNavigation({ waitUntil: "load" });
    await page.waitForSelector("div.action__3d3b0 button", { visible: true });
    await page.locator("div.action__3d3b0 button").setTimeout(3000).click();

    await page.waitForNavigation({ waitUntil: "load" });

    await delay(5000);
    const isLoggedIn = await page.evaluate(() => {
        return !document.body.innerText.includes("Login");
    });

    if (isLoggedIn) {
        let topgglink = `https://top.gg/bot/${botid}/vote`;
        await page.goto(topgglink, { waitUntil: "load" });

        while (true) {
            const isvoteable = await page.evaluate(() => {
                if (document.body.innerText.includes("You can vote now!")) {
                    return true;
                } else {
                    return false;
                }
            });

            if (isvoteable) {
                break;
            } else {
                await delay(2500);
            }
        }

        await page.evaluate(() => {
            const button = document.querySelector(
                "div.css-1yn6pjb button.chakra-button.css-7rul47"
            );

            if (!button || button.disabled) {
                return;
            }

            button.click();
        });
        await delay(5000);
    } else {
        console.log("Authorization failed.");
    }

    await browser.close();
})();
