import { env } from "../../settings";
import { createTray } from "../ui/tray";

export const translate = async (text: string) => {
  let res: Response;
  let translatedText: string;
  let error: string;
  if (env.translate.type === "libretranslate") {
    try {
      res = await fetch(env.translate.url, {
        method: "POST",
        body: JSON.stringify({
          q: text,
          source: "auto",
          target: "en",
          format: "text",
          alternatives: 3,
          api_key: env.translate.apiKey,
        }),
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      createTray("Error: " + e);
      return;
    }
    const json = await res.json();
    if (json.error) {
      createTray("Error: " + json.error);
      return;
    }
    return {
      engine: "LibreTranslate",
      text: json.translatedText,
    };
  } else if (env.translate.type === "simplytranslate") {
    const engine = env.translate.simplyTranslateEngine;
    try {
      res = await fetch(
        `${env.translate.url}?engine=${engine}&from=auto&to=english&text=${encodeURIComponent(text)}`,
        { method: "GET" },
      );
    } catch (e) {
      createTray("Error: " + e);
      return;
    }
    const json = await res.json();
    if (json.error) {
      createTray("Error: " + json.error);
      return;
    }
    return {
      engine: { google: "Google Translate", reverso: "Reverso", icib: "iCIB" }[
        engine
      ],
      via: `SimplyTranslate`,
      text: json.translated_text,
    };
  }
};
