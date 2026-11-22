import { cookies } from "next/headers";
import { Lang } from "./lang";

export async function getLangCookie(): Promise<Lang> {
  const cookieStore = await cookies();
  const lang = cookieStore.get("lang")?.value;
  return (lang === "bn" || lang === "en") ? lang : "bn";
}

export async function setLangCookie(lang: Lang): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("lang", lang, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
}