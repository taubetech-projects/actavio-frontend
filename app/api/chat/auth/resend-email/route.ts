import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // Extract email from query parameters (Next.js automatically decodes %40 to @)
  const searchParams = request.nextUrl.searchParams;
  const email = searchParams.get("email");

  console.log(`[API] Resend verification email requested for: ${email}`);

  if (!email) {
    return NextResponse.json(
      { error: "Email is required" },
      { status: 400 }
    );
  }

  // Simulate successful email sending
  return NextResponse.json({ 
    success: true, 
    message: "Verification email sent to " + email 
  });
}
