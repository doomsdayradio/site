(() => {
  const WEBSITE_ID = "14bd4f5c-1aa0-49f5-b171-e0322d4531ff";
  const SCRIPT_SRC = "https://umami.0xfab1.net/script.js";
  const OPT_OUT_KEY = "ddd_analytics_optout";

  const isDoNotTrackEnabled = () => {
    const nav = window.navigator;
    return (
      nav.doNotTrack === "1" ||
      window.doNotTrack === "1" ||
      nav.msDoNotTrack === "1" ||
      nav.globalPrivacyControl === true
    );
  };

  const isOptedOut = () => {
    try {
      return window.localStorage.getItem(OPT_OUT_KEY) === "1";
    } catch (_err) {
      return false;
    }
  };

  if (isDoNotTrackEnabled() || isOptedOut()) {
    return;
  }

  if (document.querySelector('script[data-ddd-analytics="umami"]')) {
    return;
  }

  const script = document.createElement("script");
  script.defer = true;
  script.src = SCRIPT_SRC;
  script.setAttribute("data-website-id", WEBSITE_ID);
  script.setAttribute("data-ddd-analytics", "umami");

  script.onerror = () => {
    // Intentionally silent: blockers / tracking prevention should not spam app logs.
  };

  document.head.appendChild(script);
})();
