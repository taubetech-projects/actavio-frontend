import React from "react";

export const Facebook = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H12.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"
      fill="#1877F2"
    />
    <path
      d="M16.671 15.563l.532-3.49h-3.328V9.823c0-.949.465-1.874 1.956-1.874h1.516V4.996s-1.374-.235-2.686-.235c-2.741 0-4.533 1.662-4.533 4.668v2.644H7.078v3.49h3.047V24a12.087 12.087 0 001.875.146c.636 0 1.258-.049 1.875-.146v-8.437h2.796z"
      fill="white"
    />
  </svg>
);

export const Instagram = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
    <defs>
      <radialGradient
        id="ig-gradient"
        cx="0"
        cy="0"
        r="1"
        gradientUnits="userSpaceOnUse"
        gradientTransform="rotate(135) scale(33.9411)"
      >
        <stop stopColor="#515BD4" />
        <stop offset="0.25" stopColor="#8134AF" />
        <stop offset="0.5" stopColor="#DD2A7B" />
        <stop offset="0.75" stopColor="#F58529" />
        <stop offset="1" stopColor="#FEDA77" />
      </radialGradient>
    </defs>
    <rect width="24" height="24" rx="5" fill="url(#ig-gradient)" />
    <path
      d="M12 6.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zm0 9a3.5 3.5 0 110-7 3.5 3.5 0 010 7z"
      fill="white"
    />
    <circle cx="17.5" cy="6.5" r="1.5" fill="white" />
  </svg>
);

export const Twitter = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M23.954 4.569a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.691 8.094 4.066 6.13 1.64 3.161a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.061a4.923 4.923 0 003.946 4.84 4.996 4.996 0 01-2.212.085 4.937 4.937 0 004.604 3.417 9.868 9.868 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.054 0 13.999-7.496 13.999-13.986 0-.209 0-.42-.015-.63a9.936 9.936 0 002.46-2.548l-.047-.02z"
      fill="#1DA1F2"
    />
  </svg>
);

export const LinkedIn = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003zM7.12 20.452H3.558V8.995H7.12v11.457zM5.339 7.433a2.063 2.063 0 110-4.126 2.063 2.063 0 010 4.126zM20.452 20.452h-3.558v-5.569c0-1.328-.027-3.037-1.852-3.037-1.852 0-2.136 1.445-2.136 2.939v5.667h-3.558V8.995h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.291z"
      fill="#0A66C2"
    />
  </svg>
);

export const TikTok = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 0a12 12 0 100 24 12 12 0 000-24z"
      fill="black"
    />
    <path
      d="M16.53 7.53a3.562 3.562 0 01-.61.05 3.571 3.571 0 01-3.04-1.63V15.5a3.5 3.5 0 11-3.5-3.5c.27 0 .53.03.78.09V9.11a6.452 6.452 0 00-.78-.05 6.5 6.5 0 106.5 6.5V5.51a6.52 6.52 0 003.7 1.15v-2.95a3.562 3.562 0 01-3.05-2.18h-2.95v6z"
      fill="white"
    />
  </svg>
);

export const Gmail = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z" fill="#f2f2f2" />
    <path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2l10 7 10-7z" fill="#EA4335" />
    <path d="M2 6v12c0 1.1.9 2 2 2h4V10L2 6z" fill="#4285F4" />
    <path d="M22 6v12c0 1.1-.9 2-2 2h-4V10l6-4z" fill="#34A853" />
    <path d="M16 10l-4 3-4-3v10h8V10z" fill="#FBBC05" />
  </svg>
);

export const GoogleCalendar = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M19 4h-2V2h-2v2H9V2H7v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z" fill="#4285F4" />
    <path d="M5 20h14V9H5v11zm2-9h10v2H7v-2z" fill="white" />
  </svg>
);

export const Outlook = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M16.5 1h-9C6.1 1 5 2.1 5 3.5v17C5 21.9 6.1 23 7.5 23h9c1.4 0 2.5-1.1 2.5-2.5v-17C19 2.1 17.9 1 16.5 1z" fill="#0072C6" />
    <path d="M14.5 14.5a3.5 3.5 0 110-7 3.5 3.5 0 010 7zM7.5 4.5h4v2h-4v-2zm0 13h4v2h-4v-2z" fill="white" />
  </svg>
);

export const Hubspot = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M21.1 11.2c-.4-.4-1.2-.5-1.6-.1l-1.9 1.7c-.1-.7-.4-1.3-.9-1.9L18.4 9c.4-.4.4-1.2 0-1.6l-1.4-1.4c-.4-.4-1.2-.4-1.6 0l-1.7 1.7c-.6-.5-1.2-.8-1.9-.9V4.4c0-.6-.5-1.1-1.1-1.1h-2c-.6 0-1.1.5-1.1 1.1v2.4c-.7.1-1.3.4-1.9.9L3.9 6c-.4-.3-1.1-.3-1.5 0L1 7.4c-.4.4-.4 1.1-.1 1.5l1.7 1.7c-.5.6-.8 1.2-.9 1.9H1c-.6 0-1.1.5-1.1 1.1v2c0 .6.5 1.1 1.1 1.1h2.4c.1.7.4 1.3.9 1.9L1.8 20.3c-.4.4-.4 1.2 0 1.6l1.4 1.4c.4.4 1.2.4 1.6 0l1.7-1.7c.6.5 1.2.8 1.9.9v2.4c0 .6.5 1.1 1.1 1.1h2c.6 0 1.1-.5 1.1-1.1v-2.4c.7-.1 1.3-.4 1.9-.9l1.7 1.7c.4.4 1.2.4 1.6 0l1.4-1.4c.4-.4.4-1.2 0-1.6L18 18.3c.5-.6.8-1.2.9-1.9h2.4c.6 0 1.1-.5 1.1-1.1v-2c0-.6-.5-1.1-1.3-1.1zm-8.8 3.3c-1.4 0-2.5-1.1-2.5-2.5s1.1-2.5 2.5-2.5 2.5 1.1 2.5 2.5-1.1 2.5-2.5 2.5z"
      fill="#FF7A59"
    />
  </svg>
);

export const Slack = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M5.5 12h-2c-1.1 0-2 .9-2 2s.9 2 2 2h2c1.1 0 2-.9 2-2s-.9-2-2-2z" fill="#36C5F0" />
    <path d="M8.5 7h-2c-1.1 0-2 .9-2 2s.9 2 2 2h2V7z" fill="#36C5F0" />
    <path d="M12 5.5v-2c0-1.1-.9-2-2-2s-2 .9-2 2v2c0 1.1.9 2 2 2s2-.9 2-2z" fill="#2EB67D" />
    <path d="M17 8.5V6.5c0-1.1-.9-2-2-2s-2 .9-2 2v2c0 1.1.9 2 2 2s2-.9 2-2z" fill="#2EB67D" />
    <path d="M18.5 12h2c1.1 0 2-.9 2-2s-.9-2-2-2h-2c-1.1 0-2 .9-2 2s.9 2 2 2z" fill="#ECB22E" />
    <path d="M15.5 17h2c1.1 0 2-.9 2-2s-.9-2-2-2h-2v4z" fill="#ECB22E" />
    <path d="M12 18.5v2c0 1.1.9 2 2 2s2-.9 2-2v-2c0-1.1-.9-2-2-2s-2 .9-2 2z" fill="#E01E5A" />
    <path d="M7 15.5v2c0 1.1.9 2 2 2s2-.9 2-2v-2c0-1.1-.9-2-2-2s-2 .9-2 2z" fill="#E01E5A" />
  </svg>
);

export const Notion = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M4 3h16a1 1 0 011 1v16a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z"
      fill="white"
      stroke="black"
      strokeWidth="1.5"
    />
    <path d="M7 7h1.5v10H7V7zm3 0h1.5l3.5 6V7H17v10h-1.5L12 11v6h-2V7z" fill="black" />
  </svg>
);
