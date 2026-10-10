import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  role: z.enum(["learner", "recruiter", "reviewer", "reset"]),
});

export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await request.json());
    const response = NextResponse.json({ success: true, role: body.role });

    if (body.role === "reset") {
      response.cookies.delete("nextlearn_demo_role");
    } else {
      response.cookies.set("nextlearn_demo_role", body.role, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }

    return response;
  } catch {
    return NextResponse.json({ error: "Invalid role specified." }, { status: 400 });
  }
}
