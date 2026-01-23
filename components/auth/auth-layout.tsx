import React from "react"
import Link from "next/link";
import Logo from "@/components/logo";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export default function AuthLayout({
  children,
  title,
  subtitle,
}: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* Left side - Form */}
      <div className="flex w-full flex-col justify-center px-4 py-12 sm:px-6 lg:w-1/2 lg:px-8">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="mb-8 inline-block">
            <Logo />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="mt-2 text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>

      {/* Right side - Visual */}
      <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-center lg:bg-foreground lg:px-12">
        <div className="mx-auto max-w-md text-background">
          <blockquote className="text-2xl font-medium leading-relaxed">
            &ldquo;TaskFlow transformed how I manage my daily tasks. I just
            speak, and everything gets organized automatically.&rdquo;
          </blockquote>
          <div className="mt-8 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background/20 text-lg font-semibold">
              MM
            </div>
            <div>
              <p className="font-medium">Max Mustermann</p>
              <p className="text-sm text-background/70">
                CEO, Mustermann GmbH
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
