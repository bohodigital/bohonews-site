import { PagefindUI } from "/pagefind/pagefind-ui.js";

new PagefindUI({ element: "#search", showSubResults: true, showImages: false });
const query = new URLSearchParams(location.search).get("q");
const input = document.querySelector(".pagefind-ui__search-input");
if (query && input instanceof HTMLInputElement) {
  input.value = query;
  input.dispatchEvent(new Event("input", { bubbles: true }));
}
