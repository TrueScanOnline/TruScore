/**
 * Minimal Rveel-branded legal HTML for routes served by this Vercel project.
 * Replace body copy with counsel-approved text before store submission if required.
 */

function shell(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="theme-color" content="#eef6f4"/>
<title>${title}</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml"/>
<link rel="stylesheet" href="/rveel.css"/>
</head>
<body>
<a class="skip" href="#content">Skip to content</a>
<div class="wash" aria-hidden="true"></div>
<header class="top">
  <a class="mark" href="/"><img src="/logo.svg" alt="Rveel"></a>
  <nav class="nav" aria-label="Primary"><a href="/#score">The score</a><a class="pill" href="/#get">Get the app</a></nav>
</header>
<main class="wrap section legal" id="content">
<h1 style="font-size:40px">${title.replace('Rveel — ', '')}</h1>
${body}
</main>
<footer class="site-footer"><span>Rveel</span><nav aria-label="Legal"><a href="/privacy">Privacy</a><a href="/terms">Terms</a></nav></footer>
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
