/* eslint-disable @typescript-eslint/no-explicit-any */
import type { App, ComputedRef, InjectionKey } from "vue";
import { computed, inject } from "vue";
import type { PageData } from "vuepress/client";
import { useRouteLocale } from "vuepress/client";

import type { SearchResult, WorkerSearchOptions } from "../typings/index.js";

declare const __VUEPRESS_DEV__: boolean;

export interface SearchLocaleOptions extends WorkerSearchOptions {
  suggestionsFilter?: (
    suggestions: string[],
    query: string,
    locale: string,
    pageData: PageData,
  ) => string[];
  searchFilter?: (
    results: SearchResult[],
    query: string,
    locale: string,
    pageData: PageData,
  ) => SearchResult[];
}

export interface SearchOptions extends SearchLocaleOptions {
  locales?: Record<string, SearchLocaleOptions>;
}

let slimsearchOptions: SearchOptions = {};

const slimsearchSymbol: InjectionKey<SearchOptions> = Symbol(
  __VUEPRESS_DEV__ ? "slimsearch" : "",
);

export const defineSearchConfig = (options: SearchOptions): void => {
  slimsearchOptions = options as unknown as SearchOptions;
};

export const useSearchOptions = (): ComputedRef<SearchLocaleOptions> => {
  const routeLocale = useRouteLocale();
  const { locales = {}, ...options } = inject(slimsearchSymbol)!;

  return computed(
    () =>
      <SearchLocaleOptions>{
        ...options,
        ...(locales[routeLocale.value] || {}),
      },
  );
};

export const injectSearchConfig = (app: App): void => {
  app.provide(slimsearchSymbol, slimsearchOptions);
};
