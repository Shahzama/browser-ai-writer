interface UnsupportedBannerProps {
  reason: string | null;
}

/**
 * Shown when the browser cannot run the model. Instead of a dead end, the
 * visitor sees what the app does on a supported browser, and can still use
 * the editor without AI.
 */
export function UnsupportedBanner({ reason }: UnsupportedBannerProps) {
  return (
    <section className="unsupported" role="status" aria-labelledby="unsupported-title">
      <div className="unsupported-text">
        <h2 id="unsupported-title">This browser can't run the AI model</h2>
        <p>{reason}</p>
        <p>Here is what the app does on a supported browser: fixing grammar with a reviewed diff, then continuing the text with AI.</p>
        <p className="muted small">You can still write and format text in the editor below.</p>
        <p className="small">
          <a href="https://github.com/Shahzama/browser-ai-writer" target="_blank" rel="noreferrer">
            See the code and how it works on GitHub
          </a>
        </p>
      </div>
      <img
        className="unsupported-demo"
        src="/demo.gif"
        width={800}
        height={524}
        loading="lazy"
        alt="Demo: the app fixes grammar in a selected sentence, shows the changes as a diff, then continues the text with AI"
      />
    </section>
  );
}
