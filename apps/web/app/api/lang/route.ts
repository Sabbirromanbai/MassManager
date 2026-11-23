import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Lang } from "@/lib/lang";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lang } = body as { lang?: Lang };

    if (!lang || (lang !== "bn" && lang !== "en")) {
      return NextResponse.json({ error: "Invalid language" }, { status: 400 });
    }

    const cookieStore = await cookies();
    cookieStore.set("lang", lang, {
      // UI preference: the sign-in/sign-up pages read it client-side.
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });

    return NextResponse.json({ success: true, lang });
  } catch {
    return NextResponse.json({ error: "Failed to set language" }, { status: 500 });
  }
}