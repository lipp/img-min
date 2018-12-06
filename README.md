# `<img-min>`

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/lipp/img-min)

`<img-min>` is a zero dependency vanilla web-component / custom element which can help you and your users to save a lot of bandwidth. It lazy loads minimal responsive images with auto-thumbnail and cool dissolve effect inspired by Medium.

For more info and a live demo checkout [img-min.now.sh](https://img-min.now.sh) or start playing with the [codepen.io](https://codepen.io/lipp/pen/Rqerbq).

- **Responsive**: considers actual onscreen size and dpi
- **Lazy loading**: oly load images when they are/get visible
- **WebP**: Prefer WebP over JPEG when supported
- **Dissolve effect**: Cool effect for preview/highres transition
- **Every CDN**: Works with every CDN
- **Tiny**: No deps, less than 2kb

## Installation

Add `<script>` at the top of your page:

```
<script src="https://unpkg.com/@lipp/img-min" ></script>
```

Or serve / inline yourself:

```
npm i @lipp/img-min
...
```

## Usage

### Properties

The following properties / attributes are supported:

| Property         | Decription                                            |
| ---------------- | ----------------------------------------------------- |
| `src` (required) | The url to the highres version of your image          |
| `quality`        | The quality to use for resizing (0 - 100), default 50 |
| `alt`            | The familiar img `alt` attribute                      |

### CSS custom properties

| Property       | Decription                                          |
| -------------- | --------------------------------------------------- |
| --aspect-ratio | The aspect ratio (width/height) to use, e.g. `16/9` |

To make lazy loading work optimal, the `<img-min>` should have a (responsive)
height. You can either do it yourself, or use the CSS custom property
`--aspect-ratio` for your `<img-min>` tags. You can use CSS, inline style or
JS to set the respective value. You can use the original image's width/height as
`--aspect-ratio`.

### Your custom CDN

The `<img-min>` uses a free CDN backed resizer. You can use your own by providing a `window.ImgMin.getCDNUrl` function:

```js
window.ImgMin.getCDNUrl = ({
  width, // width on screen
  height, // height on screen
  url, // original high-res image url (src attr)
  quality, // quality setting for the respective image
  format // "jpeg" or "webp"
}) => {
  // for the cloudimg.io service, this makes sense
  return `https://<YOUR-TOKEN>.cloudimg.io/width/${Math.floor(
    (60 / quality) * width
  )}/n/${url}`
}
```

## Examples

<!--
```
<custom-element-demo>
  <template>
    <script src="dist/index.min.js"></script>
  </template>
</custom-element-demo>
```
-->

```html
<div style="width: 100%;">
  <img-min
    src="https://images.unsplash.com/photo-1519681393784-d120267933ba?ixlib=rb-0.3.5&ixid=eyJhcHBfaWQiOjEyMDd9&s=9e2448175103d36c873e2511d112d339&auto=format&fit=crop&w=1350&q=80"
    quality="80"
    alt="Hero image"
    style="--aspect-ratio: 1189/792;"
  ></img-min>
</div>
```

## Copyright and License

- Licensed under MIT
- Created by [Gerhard Preuss](https://github.com/lipp)
