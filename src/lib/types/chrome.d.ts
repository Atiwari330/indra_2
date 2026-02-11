/**
 * Minimal Chrome extension API types for externally_connectable messaging.
 * Only the subset used by the Indra web app (not the full extension).
 */

interface ChromeRuntimeSendMessageOptions {
  includeTlsChannelId?: boolean;
}

interface ChromeRuntime {
  sendMessage(
    extensionId: string,
    message: unknown,
    callback: (response: Record<string, unknown>) => void
  ): void;
  lastError?: { message: string };
}

interface Chrome {
  runtime?: ChromeRuntime;
}

declare const chrome: Chrome | undefined;
