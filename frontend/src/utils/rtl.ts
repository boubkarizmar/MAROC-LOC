import { useEffect } from "react";
import i18n from "../i18n/config";

export const RTL_LANGUAGES = ["ar"];

export function isRTL(language: string): boolean {
  return RTL_LANGUAGES.includes(language);
}

export function useRTL() {
  const currentLang = i18n.language || "fr";
  const rtl = isRTL(currentLang);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    if (rtl) {
      html.setAttribute("dir", "rtl");
      html.setAttribute("lang", currentLang);
      body.classList.add("font-arabic");
      body.classList.remove("font-sans");
    } else {
      html.setAttribute("dir", "ltr");
      html.setAttribute("lang", currentLang);
      body.classList.remove("font-arabic");
      body.classList.add("font-sans");
    }
  }, [rtl, currentLang]);

  return { rtl, currentLang };
}

export function getTextAlign(language: string): "left" | "right" | "start" {
  return isRTL(language) ? "right" : "left";
}

export function getFlexDirection(language: string): "row" | "row-reverse" {
  return isRTL(language) ? "row-reverse" : "row";
}
