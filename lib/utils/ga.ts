// Google Analytics 4 Event Tracking Utilities

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
  }
}

// Event names matching GA4 recommended naming convention
export const GA_EVENTS = {
  // Model interactions
  MODEL_VIEW: 'model_view',
  MODEL_COPY_COMMAND: 'model_copy_command',
  MODEL_COMPARE_ADD: 'model_compare_add',
  MODEL_COMPARE_REMOVE: 'model_compare_remove',
  MODEL_CARD_CLICK: 'model_card_click',

  // Search & Filter
  SEARCH: 'search',
  FILTER_APPLY: 'filter_apply',
  FILTER_REMOVE: 'filter_remove',
  FILTER_RESET: 'filter_reset',
  FILTER_CHANGE: 'filter_change',

  // External links
  EXTERNAL_LINK_CLICK: 'external_link_click',

  // Engagement
  PAGE_VIEW: 'page_view',
} as const;

/**
 * Track a GA4 event
 * @param eventName - Name of the event
 * @param parameters - Event parameters
 */
export function trackEvent(
  eventName: string,
  parameters?: Record<string, string | number | boolean>,
) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, parameters);
  }
}

/**
 * Track model detail page view
 */
export function trackModelView(modelName: string, modelId: string, domain: string) {
  trackEvent(GA_EVENTS.MODEL_VIEW, {
    model_name: modelName,
    model_id: modelId,
    domain,
  });
}

/**
 * Track copy command action
 */
export function trackCopyCommand(modelName: string, command: string) {
  trackEvent(GA_EVENTS.MODEL_COPY_COMMAND, {
    model_name: modelName,
    command,
  });
}

/**
 * Track add model to comparison
 */
export function trackCompareAdd(modelName: string, modelId: string) {
  trackEvent(GA_EVENTS.MODEL_COMPARE_ADD, {
    model_name: modelName,
    model_id: modelId,
  });
}

/**
 * Track remove model from comparison
 */
export function trackCompareRemove(modelName: string, modelId: string) {
  trackEvent(GA_EVENTS.MODEL_COMPARE_REMOVE, {
    model_name: modelName,
    model_id: modelId,
  });
}

/**
 * Track model card click
 */
export function trackModelCardClick(modelName: string, modelId: string, location: string) {
  trackEvent(GA_EVENTS.MODEL_CARD_CLICK, {
    model_name: modelName,
    model_id: modelId,
    location,
  });
}

/**
 * Track search action
 */
export function trackSearch(searchTerm: string, resultCount: number) {
  trackEvent(GA_EVENTS.SEARCH, {
    search_term: searchTerm,
    result_count: resultCount,
  });
}

/**
 * Track filter application
 */
export function trackFilterApply(
  filterType: string,
  filterValue: string | string[],
  resultCount: number,
) {
  trackEvent(GA_EVENTS.FILTER_APPLY, {
    filter_type: filterType,
    filter_value: Array.isArray(filterValue) ? filterValue.join(', ') : filterValue,
    result_count: resultCount,
  });
}

/**
 * Track filter removal
 */
export function trackFilterRemove(filterType: string, filterValue: string) {
  trackEvent(GA_EVENTS.FILTER_REMOVE, {
    filter_type: filterType,
    filter_value: filterValue,
  });
}

/**
 * Track filter reset
 */
export function trackFilterReset() {
  trackEvent(GA_EVENTS.FILTER_RESET);
}

/**
 * Track external link click
 */
export function trackExternalLinkClick(url: string, linkType: 'ollama' | 'huggingface' | 'other') {
  trackEvent(GA_EVENTS.EXTERNAL_LINK_CLICK, {
    link_type: linkType,
    url,
  });
}
