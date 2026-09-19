export function getAuthRedirectSearch() {
  return {
    redirect: new URLSearchParams(window.location.search).get('redirect') || '/',
  }
}
