/**
 * Minimal Rveel-branded legal HTML for routes served by this Vercel project.
 * Replace body copy with counsel-approved text before store submission if required.
 */

const baseStyles = `
  body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;line-height:1.5;max-width:42rem;margin:2rem auto;padding:0 1rem;color:#111}
  h1{font-size:1.35rem;margin-bottom:0.5rem}
  p{margin:0.75rem 0}
  .muted{color:#555;font-size:0.9rem}
`;

function shell(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${title}</title>
<style>${baseStyles}</style>
</head>
<body>
<h1>${title}</h1>
${body}
<p class="muted">This page is served from the same infrastructure as the Rveel app. The public product name is <strong>Rveel</strong>.</p>
</body>
</html>`;
}

export function termsPageHtml(): string {
  return shell(
    'Rveel — Terms of Service',
    `<p>These Terms of Service govern your use of the <strong>Rveel</strong> mobile application and related services.</p>
<p>By using Rveel, you agree to these terms. If you do not agree, do not use the app.</p>
<p>For questions, contact the support address published in the app or store listing.</p>`
  );
}

export function privacyPageHtml(): string {
  return shell(
    'Rveel — Privacy Policy',
    `<p>This Privacy Policy describes how <strong>Rveel</strong> handles information when you use the mobile application.</p>
<p>We process data as needed to provide scanning, scoring, and related features. Details should match what is disclosed in app stores and in-product settings.</p>
<p>For questions, contact the support address published in the app or store listing.</p>`
  );
}
