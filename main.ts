/**
 * 🤘 Welcome to Stagehand!
 *
 * TO RUN THIS PROJECT:
 * ```
 * npm install
 * npm run start
 * ```
 *
 * To edit config, see `stagehand.config.ts`
 *
 * In this example, we'll be using a custom LLM client to use Ollama instead of the default OpenAI client.
 *
 * 1. Go to Hacker News (https://news.ycombinator.com)
 * 2. Use `extract` to find the top 3 stories
 */

import StagehandConfig from "./stagehand.config.js";
import { Page, BrowserContext, Stagehand } from "@browserbasehq/stagehand";
import { z } from "zod";
import chalk from "chalk";
import boxen from "boxen";
import dotenv from "dotenv";

dotenv.config();

export async function main({
  page,
  context,
  stagehand,
}: {
  page: Page;
  context: BrowserContext;
  stagehand: Stagehand;
}) {
  await stagehand.page.goto(
    "https://www.bitrefill.com/us/en/gift-cards/amazon_com-usa/"
  );

  // Wait for the page to load
  await stagehand.page.waitForLoadState("networkidle");

  // Select a denomination (first available option)
  await stagehand.page.act({
    instruction: "Click on an available gift card denomination",
    action: "click",
    selector: ".package-select-button",
  });

  // Wait a moment for the selection to register
  await stagehand.page.waitForTimeout(1000);

  // Click the Add to Cart button
  await stagehand.page.act({
    instruction: "Click the Add to Cart button",
    action: "click",
    selector: "button[data-testid='add-to-cart-button']",
  });

  // Extract cart information to verify
  const cartInfo = await stagehand.page.extract({
    instruction: "Extract the cart information",
    schema: z.object({
      itemAdded: z.boolean(),
      selectedAmount: z.number().optional(),
    }),
    useTextExtract: true,
  });

  console.log("Cart Information:", cartInfo);

  // Extract gift card information
  const giftCardInfo = await stagehand.page.extract({
    instruction:
      "Extract the available Amazon gift card denominations and prices",
    schema: z.object({
      giftCard: z.object({
        denominations: z.array(z.number()),
        currency: z.string(),
        available: z.boolean(),
      }),
    }),
    useTextExtract: true,
  });

  console.log("Gift Card Information:", giftCardInfo);

  // TODO: Future implementation for wallet integration
  // - Add Coinbase Agent Kit integration
  // - Implement wallet funding logic
  // - Handle checkout process

  //   Close the browser
  await stagehand.close();

  if (StagehandConfig.env === "BROWSERBASE" && stagehand.browserbaseSessionID) {
    console.log(
      "Session completed. Waiting for 10 seconds to see the logs and recording..."
    );
    //   Wait for 10 seconds to see the logs
    await new Promise((resolve) => setTimeout(resolve, 10000));
    console.log(
      boxen(
        `View this session recording in your browser: \n${chalk.blue(
          `https://browserbase.com/sessions/${stagehand.browserbaseSessionID}`
        )}`,
        {
          title: "Browserbase",
          padding: 1,
          margin: 3,
        }
      )
    );
  } else {
    console.log(
      "We hope you enjoyed using Stagehand locally! On Browserbase, you can bypass captchas, replay sessions, and access unparalleled debugging tools!\n10 free sessions: https://www.browserbase.com/sign-up\n\n"
    );
  }

  console.log(
    `\n🤘 Thanks for using Stagehand! Create an issue if you have any feedback: ${chalk.blue(
      "https://github.com/browserbase/stagehand/issues/new"
    )}\n`
  );
  process.exit(0);
}
