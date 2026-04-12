export default function startNavigationProgressBar() {
  window.dispatchEvent(new Event("navigation-start"));
}
