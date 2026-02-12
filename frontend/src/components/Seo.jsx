import { useEffect } from 'react';

function setMeta(name, content) {
  if (!content) return;
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setPropertyMeta(property, content) {
  if (!content) return;
  let el = document.querySelector(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel, href) {
  if (!href) return;
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export default function Seo({
  title,
  description,
  canonical,
  ogImage = 'https://retailvision.in/assets/kiosk-screen.png'
}) {
  useEffect(() => {
    if (title) document.title = title;
    if (description) setMeta('description', description);
    if (canonical) setLink('canonical', canonical);

    // OpenGraph
    if (title) setPropertyMeta('og:title', title);
    if (description) setPropertyMeta('og:description', description);
    if (canonical) setPropertyMeta('og:url', canonical);
    if (ogImage) setPropertyMeta('og:image', ogImage);

    // Twitter
    if (title) setMeta('twitter:title', title);
    if (description) setMeta('twitter:description', description);
    if (ogImage) setMeta('twitter:image', ogImage);
  }, [title, description, canonical, ogImage]);

  return null;
}
