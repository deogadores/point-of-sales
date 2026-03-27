export function Footer() {
  return (
    <footer className="border-t border-border bg-background py-3 mt-auto">
      <div className="container mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} JDG Tools. All rights reserved.
        </p>
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground">
            If this tool helped you, a coffee would mean the world!
          </p>
          <a
            href="https://ko-fi.com/X8X71WQF57"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              height="28"
              style={{ border: "0px", height: "28px" }}
              src="https://storage.ko-fi.com/cdn/kofi3.png?v=6"
              alt="Buy Me a Coffee at ko-fi.com"
            />
          </a>
        </div>
      </div>
    </footer>
  );
}
